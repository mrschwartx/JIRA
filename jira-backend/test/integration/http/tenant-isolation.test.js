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

describe('tenant isolation', () => {
  let database;
  let app;
  let victim;
  let attacker;
  let project;
  let issue;
  let comment;
  let victimBase;

  const signedIn = async () => {
    const client = app.createClient();
    const { user } = await registerUser(client);
    return { client, user };
  };

  before(async () => {
    database = await startTestDatabase();
    app = await startTestApp({ databaseUrl: database.url });
    victim = await signedIn();
    attacker = await signedIn();
    project = await createProject(victim.client);
    issue = await createIssue(victim.client, project.id, {
      title: 'Secret roadmap',
    });
    victimBase = `/api/v1/projects/${project.id}/issues`;
    const created = await victim.client.post(
      `${victimBase}/${issue.id}/comments`,
      {
        json: { body: 'confidential' },
      }
    );
    comment = created.body;
  });

  after(async () => {
    await app.stop();
    await database.stop();
  });

  it('hides every issue operation of another project behind 404', async () => {
    const { client } = attacker;
    const responses = await Promise.all([
      client.get(victimBase),
      client.post(victimBase, { json: issuePayload() }),
      client.get(`${victimBase}/${issue.id}`),
      client.patch(`${victimBase}/${issue.id}`, {
        json: { description: '<img src=x onerror=alert(1)>' },
      }),
      client.delete(`${victimBase}/${issue.id}`),
    ]);
    for (const response of responses) {
      assert.equal(response.status, 404);
    }
  });

  it('hides every comment operation of another project behind 404', async () => {
    const { client } = attacker;
    const base = `${victimBase}/${issue.id}/comments`;
    const responses = await Promise.all([
      client.get(base),
      client.post(base, { json: { body: 'forged', userId: victim.user.id } }),
      client.patch(`${base}/${comment.id}`, { json: { body: 'forged' } }),
      client.delete(`${base}/${comment.id}`),
    ]);
    for (const response of responses) {
      assert.equal(response.status, 404);
    }
  });

  it('cannot reach an issue through the project of the attacker', async () => {
    const own = await createProject(attacker.client);

    const read = await attacker.client.get(
      `/api/v1/projects/${own.id}/issues/${issue.id}`
    );
    const write = await attacker.client.patch(
      `/api/v1/projects/${own.id}/issues/${issue.id}`,
      { json: { title: 'pwned' } }
    );
    const remove = await attacker.client.delete(
      `/api/v1/projects/${own.id}/issues/${issue.id}`
    );
    const commentRead = await attacker.client.get(
      `/api/v1/projects/${own.id}/issues/${issue.id}/comments`
    );

    for (const response of [read, write, remove, commentRead]) {
      assert.equal(response.status, 404);
    }
  });

  it('cannot move an issue into another project through mass assignment', async () => {
    const own = await createProject(attacker.client);
    const mine = await createIssue(attacker.client, own.id);

    const response = await attacker.client.patch(
      `/api/v1/projects/${own.id}/issues/${mine.id}`,
      { json: { title: 'ok', projectId: project.id } }
    );

    assert.equal(response.body.projectId, own.id);
  });

  it('cannot add itself to a project or read its members', async () => {
    const join = await attacker.client.post(
      `/api/v1/projects/${project.id}/members`,
      {
        json: { userId: attacker.user.id },
      }
    );
    const members = await attacker.client.get(
      `/api/v1/projects/${project.id}/members`
    );

    assert.equal(join.status, 404);
    assert.equal(members.status, 404);
  });

  it('keeps the victim data intact after all attempts', async () => {
    const response = await victim.client.get(`${victimBase}/${issue.id}`);
    const comments = await victim.client.get(
      `${victimBase}/${issue.id}/comments`
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.title, 'Secret roadmap');
    assert.equal(response.body.description, issue.description);
    assert.equal(comments.body.length, 1);
    assert.equal(comments.body[0].body, 'confidential');
  });

  it('stores descriptions as inert text', async () => {
    const payload = '<img src=x onerror="alert(1)">';
    const updated = await victim.client.patch(`${victimBase}/${issue.id}`, {
      json: { description: payload },
    });

    assert.equal(updated.body.description, payload);
    assert.match(
      (await victim.client.get(`${victimBase}/${issue.id}`)).headers.get(
        'content-type'
      ),
      /application\/json/
    );
  });
});
