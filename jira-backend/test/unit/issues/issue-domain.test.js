import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Issue } from '../../../src/modules/issues/domain/issue.js';
import { parseOptionalHours } from '../../../src/modules/issues/domain/value-objects/hours.js';
import { IssuePriority } from '../../../src/modules/issues/domain/value-objects/issue-priority.js';
import { IssueStatus } from '../../../src/modules/issues/domain/value-objects/issue-status.js';
import { IssueTitle } from '../../../src/modules/issues/domain/value-objects/issue-title.js';
import { IssueType } from '../../../src/modules/issues/domain/value-objects/issue-type.js';
import { parseListPosition } from '../../../src/modules/issues/domain/value-objects/list-position.js';
import { ValidationError } from '../../../src/shared/domain/errors.js';
import { buildIssue, OTHER_USER_ID, USER_ID } from '../../support/builders.js';

describe('issue value objects', () => {
  it('applies defaults for type, status and priority', () => {
    assert.equal(IssueType.create(undefined).value, 'task');
    assert.equal(IssueStatus.create(undefined).value, 'backlog');
    assert.equal(IssuePriority.create(undefined).value, 'medium');
  });

  it('rejects values outside the allowed sets', () => {
    assert.throws(() => IssueType.create('epic'), ValidationError);
    assert.throws(() => IssueStatus.create('blocked'), ValidationError);
    assert.throws(() => IssuePriority.create('5'), ValidationError);
  });

  it('requires a non empty title of at most 200 characters', () => {
    assert.throws(() => IssueTitle.create('  '), ValidationError);
    assert.throws(() => IssueTitle.create('x'.repeat(201)), ValidationError);
    assert.equal(IssueTitle.create('  Fix it ').value, 'Fix it');
  });

  it('parses optional hours', () => {
    assert.equal(parseOptionalHours(undefined, 'Estimate'), null);
    assert.equal(parseOptionalHours(null, 'Estimate'), null);
    assert.equal(parseOptionalHours(0, 'Estimate'), 0);
    for (const raw of [-1, 1.5, '3', 10001, NaN]) {
      assert.throws(() => parseOptionalHours(raw, 'Estimate'), ValidationError);
    }
  });

  it('parses finite list positions only', () => {
    assert.equal(parseListPosition(2.5), 2.5);
    for (const raw of ['1', NaN, Infinity, null, undefined]) {
      assert.throws(() => parseListPosition(raw), ValidationError);
    }
  });
});

describe('Issue', () => {
  it('starts without a number and receives it from the repository', () => {
    const issue = buildIssue();
    assert.equal(issue.number, null);
    issue.assignNumber(7);
    assert.equal(issue.number, 7);
  });

  it('keeps unchanged fields and allows clearing time values', () => {
    const issue = buildIssue({ estimate: 5 });
    issue.update(
      { title: IssueTitle.create('New title'), estimate: null },
      new Date('2026-02-01T00:00:00.000Z')
    );

    const snapshot = issue.toSnapshot();
    assert.equal(snapshot.title, 'New title');
    assert.equal(snapshot.estimate, null);
    assert.equal(snapshot.priority, 'high');
    assert.equal(snapshot.updatedAt, '2026-02-01T00:00:00.000Z');
  });

  it('de-duplicates assignees and returns defensive copies', () => {
    const issue = buildIssue({ assigneeIds: [USER_ID, USER_ID] });
    assert.deepEqual(issue.assigneeIds, [USER_ID]);

    issue.assigneeIds.push(OTHER_USER_ID);
    assert.deepEqual(issue.assigneeIds, [USER_ID]);

    issue.update({ assigneeIds: [OTHER_USER_ID, OTHER_USER_ID] });
    assert.deepEqual(issue.assigneeIds, [OTHER_USER_ID]);
  });

  it('round trips through a snapshot', () => {
    const snapshot = buildIssue().toSnapshot();
    assert.deepEqual(Issue.restore(snapshot).toSnapshot(), snapshot);
  });
});
