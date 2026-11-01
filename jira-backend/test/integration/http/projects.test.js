import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { startTestDatabase } from '../../support/postgres.js';
import {
  createIssue,
  createProject,
  projectPayload,
  registerUser,
  startTestApp,
} from '../../support/test-app.js';

const MISSING_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

describe('projects over HTTP', () => {
  let database;
  let app;

  const signedIn = async () => {
    const client = app.createClient();
    const { user } = await registerUser(client);
    return { client, user };
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
    const responses = await Promise.all([
      client.get('/api/v1/projects'),
      client.post('/api/v1/projects', { json: projectPayload() }),
      client.get(`/api/v1/projects/${MISSING_ID}`),
      client.patch(`/api/v1/projects/${MISSING_ID}`, { json: {} }),
      client.delete(`/api/v1/projects/${MISSING_ID}`),
      client.get(`/api/v1/projects/${MISSING_ID}/members`),
      client.post(`/api/v1/projects/${MISSING_ID}/members`, { json: {} }),
      client.delete(`/api/v1/projects/${MISSING_ID}/members/${MISSING_ID}`),
    ]);
    for (const response of responses) {
      assert.equal(response.status, 401);
    }
  });

  describe('POST /api/v1/projects', () => {
    it('creates a project owned by the requester', async () => {
      const { client, user } = await signedIn();

      const response = await client.post('/api/v1/projects', {
        json: projectPayload({ key: 'abc', url: 'https://example.com' }),
      });

      assert.equal(response.status, 201);
      assert.equal(response.body.key, 'ABC');
      assert.equal(response.body.ownerId, user.id);
      assert.equal(response.body.role, 'owner');
      assert.equal(response.body.url, 'https://example.com');
    });

    it('makes the creator the first member', async () => {
      const { client, user } = await signedIn();
      const project = await createProject(client);

      const members = await client.get(
        `/api/v1/projects/${project.id}/members`
      );

      assert.equal(members.status, 200);
      assert.deepEqual(
        members.body.map((member) => [member.id, member.role]),
        [[user.id, 'owner']]
      );
    });

    it('rejects duplicate keys with 422 and invalid payloads with 400', async () => {
      const { client } = await signedIn();
      await createProject(client, { key: 'DUPE' });

      const duplicate = await client.post('/api/v1/projects', {
        json: projectPayload({ key: 'dupe' }),
      });
      const invalid = [
        {},
        projectPayload({ name: '' }),
        projectPayload({ key: '1x' }),
        projectPayload({ category: 'hobby' }),
        projectPayload({ url: 'javascript:alert(1)' }),
      ];

      assert.equal(duplicate.status, 422);
      for (const json of invalid) {
        const response = await client.post('/api/v1/projects', { json });
        assert.equal(response.status, 400);
      }
    });

    it('ignores a spoofed owner', async () => {
      const { client, user } = await signedIn();
      const other = await signedIn();

      const response = await client.post('/api/v1/projects', {
        json: { ...projectPayload(), ownerId: other.user.id },
      });

      assert.equal(response.body.ownerId, user.id);
    });
  });

  describe('GET /api/v1/projects', () => {
    it('lists only the projects the user belongs to', async () => {
      const first = await signedIn();
      const second = await signedIn();
      const mine = await createProject(first.client);
      await createProject(second.client);

      const response = await first.client.get('/api/v1/projects');

      assert.equal(response.status, 200);
      assert.deepEqual(
        response.body.map((project) => project.id),
        [mine.id]
      );
    });
  });

  describe('GET /api/v1/projects/:projectId', () => {
    it('returns the project with the role of the requester', async () => {
      const { client } = await signedIn();
      const project = await createProject(client);

      const response = await client.get(`/api/v1/projects/${project.id}`);

      assert.equal(response.status, 200);
      assert.equal(response.body.id, project.id);
      assert.equal(response.body.role, 'owner');
    });

    it('answers 404 for strangers and unknown ids and 400 for malformed ids', async () => {
      const owner = await signedIn();
      const stranger = await signedIn();
      const project = await createProject(owner.client);

      const foreign = await stranger.client.get(
        `/api/v1/projects/${project.id}`
      );
      const unknown = await owner.client.get(`/api/v1/projects/${MISSING_ID}`);
      const malformed = await owner.client.get('/api/v1/projects/nope');

      assert.equal(foreign.status, 404);
      assert.equal(unknown.status, 404);
      assert.equal(malformed.status, 400);
    });
  });

  describe('PATCH /api/v1/projects/:projectId', () => {
    it('lets the owner update editable fields and ignores the key', async () => {
      const { client } = await signedIn();
      const project = await createProject(client, { key: 'KEEP' });

      const response = await client.patch(`/api/v1/projects/${project.id}`, {
        json: { name: 'Renamed', category: 'business', url: null, key: 'HACK' },
      });

      assert.equal(response.status, 200);
      assert.equal(response.body.name, 'Renamed');
      assert.equal(response.body.category, 'business');
      assert.equal(response.body.url, null);
      assert.equal(response.body.key, 'KEEP');
    });

    it('forbids members and hides the project from strangers', async () => {
      const owner = await signedIn();
      const member = await signedIn();
      const stranger = await signedIn();
      const project = await createProject(owner.client);
      await owner.client.post(`/api/v1/projects/${project.id}/members`, {
        json: { userId: member.user.id },
      });

      const asMember = await member.client.patch(
        `/api/v1/projects/${project.id}`,
        {
          json: { name: 'Hacked' },
        }
      );
      const asStranger = await stranger.client.patch(
        `/api/v1/projects/${project.id}`,
        { json: { name: 'Hacked' } }
      );
      const empty = await owner.client.patch(`/api/v1/projects/${project.id}`, {
        json: {},
      });

      assert.equal(asMember.status, 403);
      assert.equal(asStranger.status, 404);
      assert.equal(empty.status, 400);
    });
  });

  describe('members', () => {
    it('lets the owner add and remove members', async () => {
      const owner = await signedIn();
      const member = await signedIn();
      const project = await createProject(owner.client);

      const added = await owner.client.post(
        `/api/v1/projects/${project.id}/members`,
        { json: { userId: member.user.id } }
      );
      const duplicate = await owner.client.post(
        `/api/v1/projects/${project.id}/members`,
        { json: { userId: member.user.id } }
      );
      const visible = await member.client.get(`/api/v1/projects/${project.id}`);
      const removed = await owner.client.delete(
        `/api/v1/projects/${project.id}/members/${member.user.id}`
      );
      const hidden = await member.client.get(`/api/v1/projects/${project.id}`);

      assert.equal(added.status, 201);
      assert.equal(added.body.role, 'member');
      assert.equal(duplicate.status, 422);
      assert.equal(visible.body.role, 'member');
      assert.equal(removed.status, 204);
      assert.equal(hidden.status, 404);
    });

    it('rejects unknown and malformed users', async () => {
      const { client } = await signedIn();
      const project = await createProject(client);

      const unknown = await client.post(
        `/api/v1/projects/${project.id}/members`,
        {
          json: { userId: MISSING_ID },
        }
      );
      const malformed = await client.post(
        `/api/v1/projects/${project.id}/members`,
        { json: { userId: 'nope' } }
      );

      assert.equal(unknown.status, 404);
      assert.equal(malformed.status, 400);
    });

    it('lets members leave but never lets anyone remove the owner', async () => {
      const owner = await signedIn();
      const member = await signedIn();
      const project = await createProject(owner.client);
      await owner.client.post(`/api/v1/projects/${project.id}/members`, {
        json: { userId: member.user.id },
      });

      const removeOwnerAsMember = await member.client.delete(
        `/api/v1/projects/${project.id}/members/${owner.user.id}`
      );
      const removeOwnerAsOwner = await owner.client.delete(
        `/api/v1/projects/${project.id}/members/${owner.user.id}`
      );
      const leave = await member.client.delete(
        `/api/v1/projects/${project.id}/members/${member.user.id}`
      );

      assert.equal(removeOwnerAsMember.status, 403);
      assert.equal(removeOwnerAsOwner.status, 400);
      assert.equal(leave.status, 204);
    });

    it('unassigns a removed member from the issues of the project', async () => {
      const owner = await signedIn();
      const member = await signedIn();
      const project = await createProject(owner.client);
      await owner.client.post(`/api/v1/projects/${project.id}/members`, {
        json: { userId: member.user.id },
      });
      const issue = await createIssue(owner.client, project.id, {
        assigneeIds: [member.user.id],
      });

      await owner.client.delete(
        `/api/v1/projects/${project.id}/members/${member.user.id}`
      );
      const response = await owner.client.get(
        `/api/v1/projects/${project.id}/issues/${issue.id}`
      );

      assert.deepEqual(response.body.assigneeIds, []);
    });
  });

  describe('DELETE /api/v1/projects/:projectId', () => {
    it('lets the owner delete the project together with its issues', async () => {
      const { client } = await signedIn();
      const project = await createProject(client);
      await createIssue(client, project.id);

      const response = await client.delete(`/api/v1/projects/${project.id}`);
      const after = await client.get(`/api/v1/projects/${project.id}`);
      const pool = await database.query(
        'SELECT count(*)::int AS total FROM issues WHERE project_id = $1',
        [project.id]
      );

      assert.equal(response.status, 204);
      assert.equal(after.status, 404);
      assert.equal(pool.rows[0].total, 0);
    });

    it('forbids members from deleting the project', async () => {
      const owner = await signedIn();
      const member = await signedIn();
      const project = await createProject(owner.client);
      await owner.client.post(`/api/v1/projects/${project.id}/members`, {
        json: { userId: member.user.id },
      });

      const response = await member.client.delete(
        `/api/v1/projects/${project.id}`
      );

      assert.equal(response.status, 403);
    });
  });
});
