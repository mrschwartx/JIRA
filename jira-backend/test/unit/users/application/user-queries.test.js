import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { GetUser } from '../../../../src/modules/users/application/use-cases/get-user.js';
import { ListUsers } from '../../../../src/modules/users/application/use-cases/list-users.js';
import { User } from '../../../../src/modules/users/domain/user.js';
import { Email } from '../../../../src/modules/users/domain/value-objects/email.js';
import { Username } from '../../../../src/modules/users/domain/value-objects/username.js';
import {
  NotFoundError,
  ValidationError,
} from '../../../../src/shared/domain/errors.js';
import { buildUser, USER_ID } from '../../../support/builders.js';
import { InMemoryUserRepository } from '../../../support/fakes/in-memory-user-repository.js';

describe('user queries', () => {
  let userRepository;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    await userRepository.add(buildUser());
    await userRepository.add(
      User.register({
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        username: Username.create('jane78'),
        email: Email.create('jane@mail.com'),
        passwordHash: 'hashed:x',
      })
    );
  });

  describe('GetUser', () => {
    it('returns a public view of the user', async () => {
      const user = await new GetUser({ userRepository }).execute({
        userId: USER_ID,
      });

      assert.equal(user.id, USER_ID);
      assert.equal(user.username, 'johndoe123');
      assert.equal('passwordHash' in user, false);
    });

    it('rejects malformed ids', async () => {
      await assert.rejects(
        () => new GetUser({ userRepository }).execute({ userId: 'nope' }),
        (error) =>
          error instanceof ValidationError &&
          error.message === 'Invalid user ID format'
      );
    });

    it('fails when the user does not exist', async () => {
      await assert.rejects(
        () =>
          new GetUser({ userRepository }).execute({
            userId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
          }),
        (error) =>
          error instanceof NotFoundError && error.message === 'User not found!'
      );
    });
  });

  describe('ListUsers', () => {
    it('finds users by username case-insensitively', async () => {
      const users = await new ListUsers({ userRepository }).execute({
        q: 'JANE',
      });
      assert.deepEqual(
        users.map((user) => user.username),
        ['jane78']
      );
      assert.ok(users.every((user) => !('passwordHash' in user)));
    });

    it('finds users by email', async () => {
      const users = await new ListUsers({ userRepository }).execute({
        q: 'johndoe',
      });
      assert.equal(users.length, 1);
    });

    it('returns an empty list when nothing matches', async () => {
      const users = await new ListUsers({ userRepository }).execute({
        q: 'zzz',
      });
      assert.deepEqual(users, []);
    });

    it('rejects missing, short, long or non string queries', async () => {
      for (const q of [undefined, 'a', 'x'.repeat(101), ['ab'], { $ne: '' }]) {
        await assert.rejects(
          () => new ListUsers({ userRepository }).execute({ q }),
          ValidationError
        );
      }
    });
  });
});
