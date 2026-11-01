import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { startTestDatabase } from '../../support/postgres.js';
import {
  createIssue,
  createProject,
  issuePayload,
  registerUser,
  startTestApp,
} from '../../support/test-app.js';

const MISSING_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

describe('issues over HTTP', () => {
  let database;
  let app;

  const signedIn = async () => {
    const client = app.createClient();
    const { user } = await registerUser(client);
    return { client, user };
  };

  const workspace = async () => {
    const owner = await signedIn();
    const project = await createProject(owner.client);
    const base = `/api/v1/projects/${project.id}/issues`;
    return { owner, project, base };
  };

  before(async () => {
    database = await startTestDatabase();
    app = await startTestApp({ databaseUrl: database.url });
  });

  after(async () => {
    await app.stop();
    await database.stop();
  });

  it('requires authentication on every route', async () => {
    const client = app.createClient();
    const base = `/api/v1/projects/${MISSING_ID}/issues`;
    const responses = await Promise.all([
      client.get(base),
      client.post(base, { json: issuePayload() }),
      client.get(`${base}/${MISSING_ID}`),
      client.patch(`${base}/${MISSING_ID}`, { json: {} }),
      client.delete(`${base}/${MISSING_ID}`),
    ]);
    for (const response of responses) {
      assert.equal(response.status, 401);
    }
  });

  describe('POST /issues', () => {
    it('creates an issue with a sequential number and defaults', async () => {
      const { owner, base } = await workspace();

      const first = await owner.client.post(base, { json: { title: 'First' } });
      const second = await owner.client.post(base, {
        json: { title: 'Second' },
      });

      assert.equal(first.status, 201);
      assert.equal(first.body.number, 1);
      assert.equal(second.body.number, 2);
      assert.equal(first.body.type, 'task');
      assert.equal(first.body.status, 'backlog');
      assert.equal(first.body.priority, 'medium');
      assert.equal(first.body.reporterId, owner.user.id);
      assert.deepEqual(first.body.assigneeIds, []);
      assert.equal(first.body.description, '');
      assert.equal(first.body.estimate, null);
    });

    it('places new issues at the top of their column', async () => {
      const { owner, base } = await workspace();

      const a = await owner.client.post(base, { json: { title: 'A' } });
      const b = await owner.client.post(base, { json: { title: 'B' } });
      const done = await owner.client.post(base, {
        json: { title: 'C', status: 'done' },
      });

      assert.equal(a.body.listPosition, 1);
      assert.equal(b.body.listPosition, 0);
      assert.equal(done.body.listPosition, 1);
    });

    it('ignores a client supplied position, number and project', async () => {
      const { owner, base } = await workspace();
      const other = await createProject(owner.client);

      const response = await owner.client.post(base, {
        json: {
          title: 'Spoof',
          listPosition: 500,
          number: 99,
          projectId: other.id,
        },
      });

      assert.equal(response.body.listPosition, 1);
      assert.equal(response.body.number, 1);
      assert.equal(response.body.projectId, base.split('/')[4]);
    });

    it('accepts members as assignees and reporter but nobody else', async () => {
      const { owner, project, base } = await workspace();
      const member = await signedIn();
      const stranger = await signedIn();
      await owner.client.post(`/api/v1/projects/${project.id}/members`, {
        json: { userId: member.user.id },
      });

      const valid = await owner.client.post(base, {
        json: {
          title: 'Team work',
          reporterId: member.user.id,
          assigneeIds: [owner.user.id, member.user.id],
        },
      });
      const outsider = await owner.client.post(base, {
        json: { title: 'X', assigneeIds: [stranger.user.id] },
      });
      const outsiderReporter = await owner.client.post(base, {
        json: { title: 'X', reporterId: stranger.user.id },
      });

      assert.equal(valid.status, 201);
      assert.equal(valid.body.reporterId, member.user.id);
      assert.equal(valid.body.assigneeIds.length, 2);
      assert.equal(outsider.status, 400);
      assert.equal(outsiderReporter.status, 400);
    });

    it('rejects invalid payloads', async () => {
      const { owner, base } = await workspace();
      const payloads = [
        {},
        { title: '' },
        { title: 'x'.repeat(201) },
        { title: 'X', type: 'epic' },
        { title: 'X', status: 'blocked' },
        { title: 'X', priority: '5' },
        { title: 'X', estimate: -1 },
        { title: 'X', timeSpent: 1.5 },
        { title: 'X', assigneeIds: ['nope'] },
        { title: 'X', description: 'x'.repeat(20001) },
      ];
      for (const json of payloads) {
        const response = await owner.client.post(base, { json });
        assert.equal(response.status, 400, JSON.stringify(json).slice(0, 60));
      }
    });

    it('numbers issues without gaps or duplicates under concurrency', async () => {
      const { owner, base } = await workspace();

      const responses = await Promise.all(
        Array.from({ length: 12 }, (_, index) =>
          owner.client.post(base, { json: { title: `Issue ${index}` } })
        )
      );

      const numbers = responses
        .map((response) => response.body.number)
        .sort((a, b) => a - b);
      assert.deepEqual(
        numbers,
        Array.from({ length: 12 }, (_, index) => index + 1)
      );
    });
  });

  describe('GET /issues', () => {
    it('lists issues ordered by list position', async () => {
      const { owner, project, base } = await workspace();
      const first = await createIssue(owner.client, project.id, { title: 'A' });
      const second = await createIssue(owner.client, project.id, {
        title: 'B',
      });

      const response = await owner.client.get(base);

      assert.equal(response.status, 200);
      assert.deepEqual(
        response.body.map((issue) => issue.id),
        [second.id, first.id]
      );
    });

    it('filters by search, status, type and assignee', async () => {
      const { owner, project, base } = await workspace();
      await createIssue(owner.client, project.id, {
        title: 'Login bug',
        type: 'bug',
        status: 'done',
        assigneeIds: [owner.user.id],
      });
      await createIssue(owner.client, project.id, {
        title: 'Docs',
        type: 'task',
        description: 'mention the LOGIN page',
      });
      await createIssue(owner.client, project.id, {
        title: 'Other',
        type: 'story',
      });

      const titles = async (query) =>
        (await owner.client.get(`${base}?${query}`)).body
          .map((issue) => issue.title)
          .sort();

      assert.deepEqual(await titles('search=login'), ['Docs', 'Login bug']);
      assert.deepEqual(await titles('status=done'), ['Login bug']);
      assert.deepEqual(await titles('type=story'), ['Other']);
      assert.deepEqual(await titles(`assigneeId=${owner.user.id}`), [
        'Login bug',
      ]);
      assert.deepEqual(await titles('search=login&type=bug'), ['Login bug']);
    });

    it('treats wildcards and regular expression characters literally', async () => {
      const { owner, project, base } = await workspace();
      await createIssue(owner.client, project.id, { title: '100% done' });
      await createIssue(owner.client, project.id, { title: 'Plain' });

      const percent = await owner.client.get(`${base}?search=%25`);
      const underscore = await owner.client.get(`${base}?search=_`);
      const regex = await owner.client.get(`${base}?search=.*`);

      assert.deepEqual(
        percent.body.map((issue) => issue.title),
        ['100% done']
      );
      assert.equal(underscore.body.length, 0);
      assert.equal(regex.body.length, 0);
    });

    it('rejects invalid filters', async () => {
      const { owner, base } = await workspace();
      for (const query of [
        'status=blocked',
        'type=epic',
        'assigneeId=nope',
        `search=${'x'.repeat(101)}`,
        'search=a&search=b',
      ]) {
        const response = await owner.client.get(`${base}?${query}`);
        assert.equal(response.status, 400, query);
      }
    });
  });

  describe('GET /issues/:issueId', () => {
    it('returns the issue and answers 404 or 400 otherwise', async () => {
      const { owner, project, base } = await workspace();
      const issue = await createIssue(owner.client, project.id);

      const found = await owner.client.get(`${base}/${issue.id}`);
      const unknown = await owner.client.get(`${base}/${MISSING_ID}`);
      const malformed = await owner.client.get(`${base}/nope`);

      assert.equal(found.status, 200);
      assert.deepEqual(found.body, issue);
      assert.equal(unknown.status, 404);
      assert.equal(malformed.status, 400);
    });
  });

  describe('PATCH /issues/:issueId', () => {
    it('updates fields, moves between columns and replaces assignees', async () => {
      const { owner, project, base } = await workspace();
      const issue = await createIssue(owner.client, project.id, {
        estimate: 8,
      });

      const moved = await owner.client.patch(`${base}/${issue.id}`, {
        json: { status: 'inprogress', listPosition: 2.5 },
      });
      const edited = await owner.client.patch(`${base}/${issue.id}`, {
        json: {
          title: 'Renamed',
          description: '',
          priority: 'lowest',
          estimate: null,
          timeSpent: 3,
          assigneeIds: [owner.user.id],
        },
      });
      const cleared = await owner.client.patch(`${base}/${issue.id}`, {
        json: { assigneeIds: [] },
      });

      assert.equal(moved.status, 200);
      assert.equal(moved.body.status, 'inprogress');
      assert.equal(moved.body.listPosition, 2.5);
      assert.equal(edited.body.title, 'Renamed');
      assert.equal(edited.body.description, '');
      assert.equal(edited.body.estimate, null);
      assert.equal(edited.body.timeSpent, 3);
      assert.deepEqual(edited.body.assigneeIds, [owner.user.id]);
      assert.deepEqual(cleared.body.assigneeIds, []);
      assert.notEqual(edited.body.updatedAt, issue.updatedAt);
    });

    it('ignores protected fields', async () => {
      const { owner, project, base } = await workspace();
      const other = await createProject(owner.client);
      const issue = await createIssue(owner.client, project.id);

      const response = await owner.client.patch(`${base}/${issue.id}`, {
        json: {
          title: 'Safe',
          projectId: other.id,
          number: 99,
          id: MISSING_ID,
        },
      });

      assert.equal(response.body.projectId, project.id);
      assert.equal(response.body.number, issue.number);
      assert.equal(response.body.id, issue.id);
    });

    it('rejects empty, invalid and out of project changes', async () => {
      const { owner, project, base } = await workspace();
      const stranger = await signedIn();
      const issue = await createIssue(owner.client, project.id);

      for (const json of [
        {},
        { projectId: MISSING_ID },
        { status: 'blocked' },
        { listPosition: 'top' },
        { estimate: 'many' },
        { assigneeIds: [stranger.user.id] },
        { reporterId: stranger.user.id },
      ]) {
        const response = await owner.client.patch(`${base}/${issue.id}`, {
          json,
        });
        assert.equal(response.status, 400, JSON.stringify(json));
      }
      const unknown = await owner.client.patch(`${base}/${MISSING_ID}`, {
        json: { title: 'X' },
      });
      assert.equal(unknown.status, 404);
    });
  });

  describe('DELETE /issues/:issueId', () => {
    it('deletes the issue together with its comments', async () => {
      const { owner, project, base } = await workspace();
      const issue = await createIssue(owner.client, project.id);
      await owner.client.post(`${base}/${issue.id}/comments`, {
        json: { body: 'bye' },
      });

      const response = await owner.client.delete(`${base}/${issue.id}`);
      const after = await owner.client.get(`${base}/${issue.id}`);
      const comments = await database.query(
        'SELECT count(*)::int AS total FROM comments WHERE issue_id = $1',
        [issue.id]
      );

      assert.equal(response.status, 204);
      assert.equal(after.status, 404);
      assert.equal(comments.rows[0].total, 0);
    });

    it('answers 404 for unknown issues', async () => {
      const { owner, base } = await workspace();
      const response = await owner.client.delete(`${base}/${MISSING_ID}`);
      assert.equal(response.status, 404);
    });
  });
});
