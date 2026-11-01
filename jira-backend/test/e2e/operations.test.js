import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { startTestDatabase } from '../support/postgres.js';
import {
  findFreePort,
  runNodeScript,
  startServerProcess,
} from '../support/server-process.js';
import { buildTestEnv } from '../support/test-config.js';

describe('e2e: operating the service', () => {
  let database;

  before(async () => {
    database = await startTestDatabase();
  });

  after(async () => {
    await database.stop();
  });

  it('refuses to start without a valid AUTH_SECRET', async () => {
    const env = buildTestEnv({
      DATABASE_URL: database.url,
      APP_PORT: String(await findFreePort()),
      AUTH_SECRET: 'too-short',
    });

    const result = await runNodeScript('src/main.js', env);

    assert.equal(result.code, 1);
    assert.match(result.stderr, /AUTH_SECRET must be at least 32 characters/);
  });

  it('refuses to start without DATABASE_URL', async () => {
    const env = {
      ...buildTestEnv({ APP_PORT: String(await findFreePort()) }),
      DATABASE_URL: '',
    };

    const result = await runNodeScript('src/main.js', env);

    assert.equal(result.code, 1);
    assert.match(result.stderr, /DATABASE_URL/);
  });

  it('exits with an error when PostgreSQL is unreachable', async () => {
    const env = buildTestEnv({
      DATABASE_URL: 'postgres://jira:jira@127.0.0.1:1/jira',
      DATABASE_TIMEOUT: '500',
      APP_PORT: String(await findFreePort()),
    });

    const result = await runNodeScript('src/main.js', env);

    assert.equal(result.code, 1);
  });

  it('exits with an error when the port is already taken', async () => {
    const running = await startServerProcess({ databaseUrl: database.url });
    try {
      const env = buildTestEnv({
        DATABASE_URL: database.url,
        APP_PORT: String(running.port),
      });

      const result = await runNodeScript('src/main.js', env);

      assert.equal(result.code, 1);
    } finally {
      await running.stop();
    }
  });

  describe('seeding', () => {
    it('seeds a demo project idempotently so demo users can sign in', async () => {
      const server = await startServerProcess({ databaseUrl: database.url });
      try {
        const first = await runNodeScript('src/scripts/seed.js', server.env);
        const second = await runNodeScript('src/scripts/seed.js', server.env);

        assert.equal(first.code, 0);
        assert.equal(second.code, 0);

        const client = server.createClient();
        const signIn = await client.post('/api/v1/auth/signin', {
          json: { email: 'alice@mail.com', password: 'password123' },
        });
        assert.equal(signIn.status, 200);

        const projects = await client.get('/api/v1/projects');
        assert.equal(projects.body.length, 1);
        assert.equal(projects.body[0].key, 'JIRA');
        assert.equal(projects.body[0].role, 'owner');

        const issues = await client.get(
          `/api/v1/projects/${projects.body[0].id}/issues`
        );
        assert.equal(issues.body.length, 8);

        const members = await client.get(
          `/api/v1/projects/${projects.body[0].id}/members`
        );
        assert.equal(members.body.length, 3);

        const bob = await server.createClient().post('/api/v1/auth/signin', {
          json: { email: 'bob@mail.com', password: 'password123' },
        });
        assert.equal(bob.status, 200);
      } finally {
        await server.stop();
      }
    });

    it('refuses to seed a production database', async () => {
      const env = buildTestEnv({
        DATABASE_URL: database.url,
        APP_LEVEL: 'production',
      });

      const result = await runNodeScript('src/scripts/seed.js', env);

      assert.equal(result.code, 1);
    });
  });
});
