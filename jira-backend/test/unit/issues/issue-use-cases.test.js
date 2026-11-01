import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { CreateIssue } from '../../../src/modules/issues/application/use-cases/create-issue.js';
import { ListIssues } from '../../../src/modules/issues/application/use-cases/list-issues.js';
import { UpdateIssue } from '../../../src/modules/issues/application/use-cases/update-issue.js';
import { ProjectAccess } from '../../../src/modules/projects/application/project-access.js';
import {
  NotFoundError,
  ValidationError,
} from '../../../src/shared/domain/errors.js';
import {
  buildIssue,
  ISSUE_ID,
  OTHER_USER_ID,
  PROJECT_ID,
  USER_ID,
} from '../../support/builders.js';

const STRANGER_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

describe('issue use cases', () => {
  let issueRepository;
  let projectAccess;
  let stored;
  let lowest;
  let listCalls;

  beforeEach(() => {
    stored = buildIssue();
    lowest = null;
    listCalls = [];
    const members = new Set([USER_ID, OTHER_USER_ID]);
    projectAccess = new ProjectAccess({
      projectRepository: {
        findMembership: async ({ projectId, userId }) =>
          projectId === PROJECT_ID && members.has(userId)
            ? { role: 'member' }
            : null,
        filterMemberIds: async ({ userIds }) =>
          userIds.filter((id) => members.has(id)),
      },
    });
    issueRepository = {
      nextId: () => ISSUE_ID,
      minListPosition: async () => lowest,
      add: async (issue) => {
        stored = issue;
        issue.assignNumber(1);
      },
      findById: async ({ issueId }) => (issueId === ISSUE_ID ? stored : null),
      update: async (issue) => {
        stored = issue;
        return true;
      },
      list: async (filters) => {
        listCalls.push(filters);
        return [stored];
      },
    };
  });

  describe('CreateIssue', () => {
    const build = () => new CreateIssue({ issueRepository, projectAccess });

    it('places the first issue of a column at position 1', async () => {
      const issue = await build().execute({
        requesterId: USER_ID,
        projectId: PROJECT_ID,
        input: { title: 'First' },
      });
      assert.equal(issue.listPosition, 1);
      assert.equal(issue.status, 'backlog');
      assert.equal(issue.reporterId, USER_ID);
      assert.equal(issue.number, 1);
    });

    it('places new issues above the lowest position of the column', async () => {
      lowest = 3.5;
      const issue = await build().execute({
        requesterId: USER_ID,
        projectId: PROJECT_ID,
        input: { title: 'Top', status: 'done', listPosition: 999 },
      });
      assert.equal(issue.listPosition, 2.5);
    });

    it('rejects assignees or reporters outside the project', async () => {
      for (const input of [
        { title: 'X', assigneeIds: [STRANGER_ID] },
        { title: 'X', reporterId: STRANGER_ID },
      ]) {
        await assert.rejects(
          () =>
            build().execute({
              requesterId: USER_ID,
              projectId: PROJECT_ID,
              input,
            }),
          ValidationError
        );
      }
    });

    it('hides the project from non members', async () => {
      await assert.rejects(
        () =>
          build().execute({
            requesterId: STRANGER_ID,
            projectId: PROJECT_ID,
            input: { title: 'X' },
          }),
        NotFoundError
      );
    });

    it('rejects invalid payloads', async () => {
      for (const input of [
        {},
        { title: '' },
        { title: 'X', type: 'epic' },
        { title: 'X', estimate: -1 },
        { title: 'X', assigneeIds: 'nope' },
      ]) {
        await assert.rejects(
          () =>
            build().execute({
              requesterId: USER_ID,
              projectId: PROJECT_ID,
              input,
            }),
          ValidationError
        );
      }
    });
  });

  describe('UpdateIssue', () => {
    const build = () => new UpdateIssue({ issueRepository, projectAccess });
    const run = (changes, issueId = ISSUE_ID) =>
      build().execute({
        requesterId: USER_ID,
        projectId: PROJECT_ID,
        issueId,
        changes,
      });

    it('updates whitelisted fields only', async () => {
      const issue = await run({
        status: 'done',
        listPosition: 4.25,
        projectId: STRANGER_ID,
        number: 99,
      });
      assert.equal(issue.status, 'done');
      assert.equal(issue.listPosition, 4.25);
      assert.equal(issue.projectId, PROJECT_ID);
      assert.equal(issue.number, null);
    });

    it('replaces assignees and clears time values', async () => {
      stored = buildIssue({ estimate: 8 });
      const issue = await run({ assigneeIds: [OTHER_USER_ID], estimate: null });
      assert.deepEqual(issue.assigneeIds, [OTHER_USER_ID]);
      assert.equal(issue.estimate, null);
    });

    it('rejects empty payloads and unknown only payloads', async () => {
      await assert.rejects(() => run({}), ValidationError);
      await assert.rejects(
        () => run({ projectId: STRANGER_ID }),
        ValidationError
      );
      await assert.rejects(() => run(null), ValidationError);
    });

    it('rejects assignees that are not members', async () => {
      await assert.rejects(
        () => run({ assigneeIds: [STRANGER_ID] }),
        ValidationError
      );
    });

    it('fails for unknown issues', async () => {
      await assert.rejects(
        () => run({ status: 'done' }, 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
        NotFoundError
      );
    });
  });

  describe('ListIssues', () => {
    const build = () => new ListIssues({ issueRepository, projectAccess });

    it('forwards validated filters to the repository', async () => {
      await build().execute({
        requesterId: USER_ID,
        projectId: PROJECT_ID,
        search: '  login ',
        status: 'done',
        type: 'bug',
        assigneeId: OTHER_USER_ID,
      });
      assert.deepEqual(listCalls[0], {
        projectId: PROJECT_ID,
        search: 'login',
        status: 'done',
        type: 'bug',
        assigneeId: OTHER_USER_ID,
        limit: 1000,
      });
    });

    it('rejects invalid filters', async () => {
      for (const filters of [
        { status: 'blocked' },
        { type: 'epic' },
        { assigneeId: 'nope' },
        { search: ['a'] },
        { search: 'x'.repeat(101) },
      ]) {
        await assert.rejects(
          () =>
            build().execute({
              requesterId: USER_ID,
              projectId: PROJECT_ID,
              ...filters,
            }),
          ValidationError
        );
      }
    });
  });
});
