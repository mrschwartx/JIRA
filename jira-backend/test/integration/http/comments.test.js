import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { startTestDatabase } from '../../support/postgres.js';
import {
  createIssue,
  createProject,
  registerUser,
  startTestApp,
} from '../../support/test-app.js';

const MISSING_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

describe('comments over HTTP', () => {
  let database;
  let app;

  const signedIn = async () => {
    const client = app.createClient();
    const { user } = await registerUser(client);
    return { client, user };
  };

  const workspace = async () => {
    const owner = await signedIn();
    const member = await signedIn();
    const project = await createProject(owner.client);
    await owner.client.post(`/api/v1/projects/${project.id}/members`, {
      json: { userId: member.user.id },
    });
    const issue = await createIssue(owner.client, project.id);
    const base = `/api/v1/projects/${project.id}/issues/${issue.id}/comments`;
    return { owner, member, project, issue, base };
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
    const base = `/api/v1/projects/${MISSING_ID}/issues/${MISSING_ID}/comments`;
    const responses = await Promise.all([
      client.get(base),
      client.post(base, { json: { body: 'x' } }),
      client.patch(`${base}/${MISSING_ID}`, { json: { body: 'x' } }),
      client.delete(`${base}/${MISSING_ID}`),
    ]);
    for (const response of responses) {
      assert.equal(response.status, 401);
    }
  });

  it('creates comments authored by the requester with author details', async () => {
    const { member, base } = await workspace();

    const response = await member.client.post(base, {
      json: { body: 'Looks good', authorId: MISSING_ID, userId: MISSING_ID },
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.body, 'Looks good');
    assert.equal(response.body.author.id, member.user.id);
    assert.equal(response.body.author.username, member.user.username);
    assert.equal('passwordHash' in response.body.author, false);
  });

  it('lists comments newest first', async () => {
    const { owner, member, base } = await workspace();
    await owner.client.post(base, { json: { body: 'first' } });
    await member.client.post(base, { json: { body: 'second' } });

    const response = await owner.client.get(base);

    assert.equal(response.status, 200);
    assert.deepEqual(
      response.body.map((comment) => comment.body),
      ['second', 'first']
    );
  });

  it('rejects empty and oversized bodies', async () => {
    const { owner, base } = await workspace();
    for (const json of [
      {},
      { body: '' },
      { body: '   ' },
      { body: 'x'.repeat(5001) },
    ]) {
      const response = await owner.client.post(base, { json });
      assert.equal(response.status, 400);
    }
  });

  it('lets only the author edit a comment', async () => {
    const { owner, member, base } = await workspace();
    const created = await member.client.post(base, { json: { body: 'mine' } });

    const edited = await member.client.patch(`${base}/${created.body.id}`, {
      json: { body: 'edited' },
    });
    const byOwner = await owner.client.patch(`${base}/${created.body.id}`, {
      json: { body: 'hijacked' },
    });

    assert.equal(edited.status, 200);
    assert.equal(edited.body.body, 'edited');
    assert.equal(byOwner.status, 403);
  });

  it('lets the author and the project owner delete a comment but not other members', async () => {
    const { owner, member, project, base } = await workspace();
    const third = await signedIn();
    await owner.client.post(`/api/v1/projects/${project.id}/members`, {
      json: { userId: third.user.id },
    });
    const first = await member.client.post(base, { json: { body: 'a' } });
    const second = await member.client.post(base, { json: { body: 'b' } });

    const byThird = await third.client.delete(`${base}/${first.body.id}`);
    const byAuthor = await member.client.delete(`${base}/${first.body.id}`);
    const byOwner = await owner.client.delete(`${base}/${second.body.id}`);
    const missing = await owner.client.delete(`${base}/${MISSING_ID}`);

    assert.equal(byThird.status, 403);
    assert.equal(byAuthor.status, 204);
    assert.equal(byOwner.status, 204);
    assert.equal(missing.status, 404);
  });

  it('keeps comments readable after the author leaves the project', async () => {
    const { owner, member, project, base } = await workspace();
    await member.client.post(base, { json: { body: 'still here' } });

    await owner.client.delete(
      `/api/v1/projects/${project.id}/members/${member.user.id}`
    );
    const response = await owner.client.get(base);

    assert.equal(response.body.length, 1);
    assert.equal(response.body[0].author.id, member.user.id);
  });

  it('shows a null author after the account is deleted', async () => {
    const { owner, member, base } = await workspace();
    await member.client.post(base, { json: { body: 'orphan' } });

    await member.client.delete(`/api/v1/users/${member.user.id}`);
    const response = await owner.client.get(base);

    assert.equal(response.body[0].body, 'orphan');
    assert.equal(response.body[0].author, null);
  });
});
