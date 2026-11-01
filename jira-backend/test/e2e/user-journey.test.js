import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { startTestDatabase } from '../support/postgres.js';
import { startServerProcess } from '../support/server-process.js';

describe('e2e: a team works through a project', () => {
  let database;
  let server;

  before(async () => {
    database = await startTestDatabase();
    server = await startServerProcess({ databaseUrl: database.url });
  });

  after(async () => {
    await server.stop();
    await database.stop();
  });

  it('runs the whole life cycle of a project', async () => {
    const owner = server.createClient();
    const teammate = server.createClient();
    const outsider = server.createClient();

    const ownerAccount = await owner.post('/api/v1/auth/signup', {
      json: {
        username: 'olivia',
        email: 'olivia@mail.com',
        password: 'Password123!',
      },
    });
    const teammateAccount = await teammate.post('/api/v1/auth/signup', {
      json: {
        username: 'tomas',
        email: 'tomas@mail.com',
        password: 'Password123!',
      },
    });
    await outsider.post('/api/v1/auth/signup', {
      json: {
        username: 'oscar',
        email: 'oscar@mail.com',
        password: 'Password123!',
      },
    });
    assert.equal(ownerAccount.status, 201);
    assert.equal(teammateAccount.status, 201);

    const project = (
      await owner.post('/api/v1/projects', {
        json: { key: 'SHIP', name: 'Ship it', category: 'software' },
      })
    ).body;
    assert.equal(project.role, 'owner');

    const search = await owner.get('/api/v1/users?q=tomas');
    assert.equal(search.body[0].id, teammateAccount.body.id);
    const added = await owner.post(`/api/v1/projects/${project.id}/members`, {
      json: { userId: teammateAccount.body.id },
    });
    assert.equal(added.status, 201);

    const issuesPath = `/api/v1/projects/${project.id}/issues`;
    const issue = (
      await owner.post(issuesPath, {
        json: {
          title: 'Release 1.0',
          type: 'story',
          priority: 'highest',
          assigneeIds: [teammateAccount.body.id],
          estimate: 10,
        },
      })
    ).body;
    assert.equal(issue.number, 1);

    const comment = await teammate.post(`${issuesPath}/${issue.id}/comments`, {
      json: { body: 'On it' },
    });
    assert.equal(comment.status, 201);

    const moved = await teammate.patch(`${issuesPath}/${issue.id}`, {
      json: {
        status: 'inprogress',
        listPosition: 1,
        timeSpent: 4,
        timeRemaining: 6,
      },
    });
    assert.equal(moved.body.status, 'inprogress');

    const outsiderView = await outsider.get(`${issuesPath}/${issue.id}`);
    assert.equal(outsiderView.status, 404);

    const board = await owner.get(`${issuesPath}?status=inprogress`);
    assert.deepEqual(
      board.body.map((entry) => entry.id),
      [issue.id]
    );

    const comments = await owner.get(`${issuesPath}/${issue.id}/comments`);
    assert.equal(comments.body[0].author.username, 'tomas');

    await teammate.delete(
      `/api/v1/projects/${project.id}/members/${teammateAccount.body.id}`
    );
    const afterLeaving = await teammate.get(issuesPath);
    assert.equal(afterLeaving.status, 404);

    const closed = await owner.delete(`/api/v1/projects/${project.id}`);
    assert.equal(closed.status, 204);
    assert.equal((await owner.get('/api/v1/projects')).body.length, 0);

    const signOut = await owner.post('/api/v1/auth/signout');
    assert.equal(signOut.status, 204);
    assert.equal((await owner.get('/api/v1/auth/me')).status, 401);
  });
});
