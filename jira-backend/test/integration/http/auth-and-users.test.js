import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { createImageForm } from '../../support/http-client.js';
import { startTestDatabase } from '../../support/postgres.js';
import { registerUser, startTestApp } from '../../support/test-app.js';

const MISSING_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;

describe('auth and users over HTTP', () => {
  let database;
  let app;

  const signedIn = async (overrides) => {
    const client = app.createClient();
    const { user, credentials } = await registerUser(client, overrides);
    return { client, user, credentials };
  };

  before(async () => {
    database = await startTestDatabase();
    app = await startTestApp({ databaseUrl: database.url });
  });

  after(async () => {
    await app.stop();
    await database.stop();
  });

  it('serves a welcome message on the root', async () => {
    const response = await app.createClient().get('/');
    assert.equal(response.status, 200);
    assert.equal(response.body.message, 'Welcome to the Jira API');
  });

  it('sets security headers and allows cross origin avatar loading', async () => {
    const response = await app.createClient().get('/');
    assert.equal(response.headers.get('x-powered-by'), null);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(
      response.headers.get('cross-origin-resource-policy'),
      'cross-origin'
    );
  });

  describe('POST /api/v1/auth/signup', () => {
    it('creates a user and starts a session', async () => {
      const client = app.createClient();
      const { credentials, response } = await registerUser(client);

      assert.equal(response.status, 201);
      assert.match(response.body.id, UUID);
      assert.equal(response.body.username, credentials.username);
      assert.equal(response.body.avatar, '/images/users/default-avatar.jpg');
      assert.equal('password' in response.body, false);
      assert.equal('passwordHash' in response.body, false);
      assert.equal(client.hasCookie('jira_token'), true);
      assert.match(response.setCookie[0], /HttpOnly/i);
    });

    it('rejects duplicates with 422 and invalid input with 400', async () => {
      const { credentials } = await signedIn();
      const client = app.createClient();

      const duplicate = await client.post('/api/v1/auth/signup', {
        json: credentials,
      });
      const invalid = await client.post('/api/v1/auth/signup', {
        json: { username: 'a', email: 'nope', password: 'short' },
      });

      assert.equal(duplicate.status, 422);
      assert.equal(invalid.status, 400);
    });

    it('answers 400 for malformed JSON', async () => {
      const response = await app.createClient().post('/api/v1/auth/signup', {
        headers: { 'content-type': 'application/json' },
        raw: '{broken',
      });
      assert.equal(response.status, 400);
    });
  });

  describe('POST /api/v1/auth/signin', () => {
    it('signs in with valid credentials', async () => {
      const { credentials, user } = await signedIn();
      const client = app.createClient();

      const response = await client.post('/api/v1/auth/signin', {
        json: { email: credentials.email, password: credentials.password },
      });

      assert.equal(response.status, 200);
      assert.equal(response.body.id, user.id);
      assert.equal(client.hasCookie('jira_token'), true);
    });

    it('answers 401 with the same message for unknown emails and wrong passwords', async () => {
      const { credentials } = await signedIn();
      const client = app.createClient();

      const unknown = await client.post('/api/v1/auth/signin', {
        json: { email: 'ghost@mail.com', password: 'Password123!' },
      });
      const wrong = await client.post('/api/v1/auth/signin', {
        json: { email: credentials.email, password: 'wrong-password' },
      });

      assert.equal(unknown.status, 401);
      assert.equal(wrong.status, 401);
      assert.equal(unknown.body.message, wrong.body.message);
      assert.equal(client.hasCookie('jira_token'), false);
    });
  });

  describe('POST /api/v1/auth/signout and GET /api/v1/auth/me', () => {
    it('returns the current user, then clears the session on sign out', async () => {
      const { client, user } = await signedIn();

      const me = await client.get('/api/v1/auth/me');
      const signOut = await client.post('/api/v1/auth/signout');
      const after = await client.get('/api/v1/auth/me');

      assert.equal(me.status, 200);
      assert.equal(me.body.id, user.id);
      assert.equal(signOut.status, 204);
      assert.equal(client.hasCookie('jira_token'), false);
      assert.equal(after.status, 401);
    });
  });

  describe('authentication guard', () => {
    it('requires a session on every users route', async () => {
      const client = app.createClient();
      const responses = await Promise.all([
        client.get('/api/v1/auth/me'),
        client.get('/api/v1/users?q=ab'),
        client.get(`/api/v1/users/${MISSING_ID}`),
        client.patch(`/api/v1/users/${MISSING_ID}`, { json: {} }),
        client.put(`/api/v1/users/${MISSING_ID}/avatar`),
        client.delete(`/api/v1/users/${MISSING_ID}`),
      ]);
      for (const response of responses) {
        assert.equal(response.status, 401);
      }
    });

    it('rejects an invalid token with 401', async () => {
      const response = await app.createClient().get('/api/v1/auth/me', {
        headers: { cookie: 'jira_token=garbage' },
      });
      assert.equal(response.status, 401);
    });
  });

  describe('rate limiting', () => {
    it('throttles repeated authentication attempts', async () => {
      const limited = await startTestApp({
        databaseUrl: database.url,
        overrides: { AUTH_RATE_LIMIT_MAX: '3' },
      });
      try {
        const client = limited.createClient();
        const statuses = [];
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const response = await client.post('/api/v1/auth/signin', {
            json: { email: 'ghost@mail.com', password: 'Password123!' },
          });
          statuses.push(response.status);
        }
        assert.deepEqual(statuses, [401, 401, 401, 429, 429]);
      } finally {
        await limited.stop();
      }
    });
  });

  describe('GET /api/v1/users', () => {
    it('finds users by username or email without exposing secrets', async () => {
      const { client } = await signedIn();
      const target = await signedIn({
        username: 'zelda_hero',
        email: 'zelda@hyrule.com',
      });

      const byName = await client.get('/api/v1/users?q=ZELDA_h');
      const byEmail = await client.get('/api/v1/users?q=hyrule.com');

      assert.equal(byName.status, 200);
      assert.deepEqual(
        byName.body.map((user) => user.id),
        [target.user.id]
      );
      assert.equal(byEmail.body.length, 1);
      assert.equal('passwordHash' in byName.body[0], false);
    });

    it('returns an empty list when nothing matches', async () => {
      const { client } = await signedIn();
      const response = await client.get('/api/v1/users?q=nobodyhasthisname');
      assert.equal(response.status, 200);
      assert.deepEqual(response.body, []);
    });

    it('requires a query of a sensible length and treats wildcards literally', async () => {
      const { client } = await signedIn();
      for (const query of ['', '?q=a', '?q=%25%25']) {
        const response = await client.get(`/api/v1/users${query}`);
        assert.equal(
          response.status === 400 || response.body.length === 0,
          true
        );
      }
      const missing = await client.get('/api/v1/users');
      assert.equal(missing.status, 400);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('returns the user, 400 for malformed ids and 404 for unknown ids', async () => {
      const { client, user } = await signedIn();

      const found = await client.get(`/api/v1/users/${user.id}`);
      const malformed = await client.get('/api/v1/users/nope');
      const unknown = await client.get(`/api/v1/users/${MISSING_ID}`);

      assert.equal(found.status, 200);
      assert.equal(found.body.id, user.id);
      assert.equal(malformed.status, 400);
      assert.equal(unknown.status, 404);
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('updates the profile and accepts the new password', async () => {
      const { client, user, credentials } = await signedIn();

      const response = await client.patch(`/api/v1/users/${user.id}`, {
        json: { username: 'renamed_user', password: 'NewPassword456!' },
      });
      const signIn = await app.createClient().post('/api/v1/auth/signin', {
        json: { email: credentials.email, password: 'NewPassword456!' },
      });

      assert.equal(response.status, 200);
      assert.equal(response.body.username, 'renamed_user');
      assert.equal(signIn.status, 200);
    });

    it('rejects other accounts with 401, collisions with 422 and empty updates with 400', async () => {
      const first = await signedIn();
      const second = await signedIn();

      const foreign = await second.client.patch(
        `/api/v1/users/${first.user.id}`,
        {
          json: { username: 'hijacked' },
        }
      );
      const collision = await second.client.patch(
        `/api/v1/users/${second.user.id}`,
        { json: { username: first.user.username } }
      );
      const empty = await second.client.patch(
        `/api/v1/users/${second.user.id}`,
        {
          json: { avatar: '/etc/passwd' },
        }
      );

      assert.equal(foreign.status, 401);
      assert.equal(collision.status, 422);
      assert.equal(empty.status, 400);
    });
  });

  describe('PUT /api/v1/users/:id/avatar', () => {
    const avatarFiles = () =>
      fs
        .readdirSync(path.join(app.publicDir, 'images', 'users'))
        .filter((name) => name.startsWith('avatar-'));

    it('stores the avatar, serves it, and replaces the previous one', async () => {
      const { client, user } = await signedIn();

      const first = await client.put(`/api/v1/users/${user.id}/avatar`, {
        form: createImageForm(),
      });
      const second = await client.put(`/api/v1/users/${user.id}/avatar`, {
        form: createImageForm({ type: 'image/webp', filename: 'a.webp' }),
      });
      const served = await client.get(second.body.avatar);

      assert.equal(first.status, 200);
      assert.match(first.body.avatar, /^\/images\/users\/avatar-.+\.png$/);
      assert.match(second.body.avatar, /\.webp$/);
      assert.equal(served.status, 200);
      assert.equal(
        avatarFiles().filter((name) => name.endsWith('.png')).length,
        0
      );
    });

    it('rejects non image uploads, oversized files, missing files and other accounts', async () => {
      const { client, user } = await signedIn();
      const other = await signedIn();
      const before = avatarFiles().length;

      const notImage = await client.put(`/api/v1/users/${user.id}/avatar`, {
        form: createImageForm({ type: 'text/html', filename: 'x.html' }),
      });
      const tooLarge = await client.put(`/api/v1/users/${user.id}/avatar`, {
        form: createImageForm({ size: 2 * 1024 * 1024 + 1 }),
      });
      const missing = await client.put(`/api/v1/users/${user.id}/avatar`);
      const foreign = await other.client.put(
        `/api/v1/users/${user.id}/avatar`,
        {
          form: createImageForm(),
        }
      );

      assert.equal(notImage.status, 400);
      assert.equal(tooLarge.status, 400);
      assert.equal(missing.status, 400);
      assert.equal(foreign.status, 401);
      assert.equal(avatarFiles().length, before);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('deletes the account, ends the session and removes the avatar', async () => {
      const { client, user } = await signedIn();
      const upload = await client.put(`/api/v1/users/${user.id}/avatar`, {
        form: createImageForm(),
      });
      const avatarFile = path.join(app.publicDir, upload.body.avatar);
      assert.equal(fs.existsSync(avatarFile), true);

      const response = await client.delete(`/api/v1/users/${user.id}`);
      const after = await client.get(`/api/v1/users/${user.id}`);

      assert.equal(response.status, 204);
      assert.equal(client.hasCookie('jira_token'), false);
      assert.equal(after.status, 401);
      assert.equal(fs.existsSync(avatarFile), false);
    });

    it('rejects deleting another account with 401', async () => {
      const first = await signedIn();
      const second = await signedIn();

      const response = await second.client.delete(
        `/api/v1/users/${first.user.id}`
      );

      assert.equal(response.status, 401);
    });
  });
});
