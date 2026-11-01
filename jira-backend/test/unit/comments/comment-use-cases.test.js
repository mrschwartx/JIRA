import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { toCommentDto } from '../../../src/modules/comments/application/comment-dto.js';
import { DeleteComment } from '../../../src/modules/comments/application/use-cases/delete-comment.js';
import { UpdateComment } from '../../../src/modules/comments/application/use-cases/update-comment.js';
import { Comment } from '../../../src/modules/comments/domain/comment.js';
import { CommentBody } from '../../../src/modules/comments/domain/comment-body.js';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../src/shared/domain/errors.js';
import {
  ISSUE_ID,
  OTHER_USER_ID,
  PROJECT_ID,
  USER_ID,
} from '../../support/builders.js';

const COMMENT_ID = '99999999-9999-9999-9999-999999999999';
const THIRD_USER_ID = '77777777-7777-7777-7777-777777777777';

const buildComment = (authorId = OTHER_USER_ID) =>
  Comment.create({
    id: COMMENT_ID,
    issueId: ISSUE_ID,
    authorId,
    body: CommentBody.create('Looks good'),
    now: new Date('2026-01-01T00:00:00.000Z'),
  });

describe('comment domain', () => {
  it('requires a body of at most 5000 characters', () => {
    assert.throws(() => CommentBody.create(''), ValidationError);
    assert.throws(() => CommentBody.create('x'.repeat(5001)), ValidationError);
  });

  it('tracks the author and edits', () => {
    const comment = buildComment();
    assert.equal(comment.isAuthoredBy(OTHER_USER_ID), true);
    assert.equal(comment.isAuthoredBy(USER_ID), false);

    comment.edit(
      CommentBody.create('Edited'),
      new Date('2026-02-01T00:00:00.000Z')
    );
    assert.equal(comment.body.value, 'Edited');
    assert.equal(comment.updatedAt, '2026-02-01T00:00:00.000Z');
  });

  it('maps a read model to a dto', () => {
    const dto = toCommentDto({
      id: COMMENT_ID,
      issueId: ISSUE_ID,
      body: 'x',
      author: null,
      createdAt: 'a',
      updatedAt: 'b',
      secret: 'hidden',
    });
    assert.equal('secret' in dto, false);
    assert.equal(dto.author, null);
  });
});

describe('comment permissions', () => {
  let stored;
  let deleted;
  let commentRepository;
  let projectAccess;
  const issueGateway = { assertExists: async ({ issueId }) => issueId };

  const accessFor = (roles) => ({
    requireMember: async ({ projectId, userId }) => {
      if (!roles[userId]) {
        throw new NotFoundError('Project not found!');
      }
      return { projectId, role: roles[userId] };
    },
  });

  beforeEach(() => {
    stored = buildComment();
    deleted = false;
    commentRepository = {
      findById: async () => stored,
      update: async () => true,
      deleteById: async () => {
        deleted = true;
        return true;
      },
      findViewById: async () => ({
        id: COMMENT_ID,
        issueId: ISSUE_ID,
        body: stored.body.value,
        author: null,
        createdAt: stored.createdAt,
        updatedAt: stored.updatedAt,
      }),
    };
    projectAccess = accessFor({
      [USER_ID]: 'owner',
      [OTHER_USER_ID]: 'member',
      [THIRD_USER_ID]: 'member',
    });
  });

  const scope = (requesterId) => ({
    requesterId,
    projectId: PROJECT_ID,
    issueId: ISSUE_ID,
    commentId: COMMENT_ID,
  });
  const dependencies = () => ({
    commentRepository,
    projectAccess,
    issueGateway,
  });

  it('lets only the author edit a comment', async () => {
    const useCase = new UpdateComment(dependencies());

    const result = await useCase.execute({
      ...scope(OTHER_USER_ID),
      input: { body: 'Edited' },
    });
    assert.equal(result.body, 'Edited');

    for (const intruder of [USER_ID, THIRD_USER_ID]) {
      await assert.rejects(
        () => useCase.execute({ ...scope(intruder), input: { body: 'Nope' } }),
        ForbiddenError
      );
    }
  });

  it('validates the body before touching the repository', async () => {
    await assert.rejects(
      () =>
        new UpdateComment(dependencies()).execute({
          ...scope(OTHER_USER_ID),
          input: { body: '' },
        }),
      ValidationError
    );
  });

  it('lets the author and the project owner delete a comment', async () => {
    for (const requester of [OTHER_USER_ID, USER_ID]) {
      deleted = false;
      await new DeleteComment(dependencies()).execute(scope(requester));
      assert.equal(deleted, true);
    }
  });

  it('stops other members from deleting a comment', async () => {
    await assert.rejects(
      () => new DeleteComment(dependencies()).execute(scope(THIRD_USER_ID)),
      ForbiddenError
    );
    assert.equal(deleted, false);
  });

  it('hides comments from non members', async () => {
    await assert.rejects(
      () =>
        new DeleteComment(dependencies()).execute(
          scope('88888888-8888-8888-8888-888888888888')
        ),
      NotFoundError
    );
  });

  it('fails for unknown comments', async () => {
    commentRepository.findById = async () => null;
    await assert.rejects(
      () => new DeleteComment(dependencies()).execute(scope(USER_ID)),
      NotFoundError
    );
  });
});
