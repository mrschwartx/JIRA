import { parseEntityId } from '../../../../shared/domain/entity-id.js';
import {
  NotFoundError,
  ValidationError,
} from '../../../../shared/domain/errors.js';
import { parseOptionalHours } from '../../domain/value-objects/hours.js';
import { IssueDescription } from '../../domain/value-objects/issue-description.js';
import { IssuePriority } from '../../domain/value-objects/issue-priority.js';
import { IssueStatus } from '../../domain/value-objects/issue-status.js';
import { IssueTitle } from '../../domain/value-objects/issue-title.js';
import { IssueType } from '../../domain/value-objects/issue-type.js';
import { parseListPosition } from '../../domain/value-objects/list-position.js';
import { toIssueDto } from '../issue-dto.js';
import { parseUserIdList } from '../parse-user-ids.js';

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const PARSERS = Object.freeze({
  title: (raw) => IssueTitle.create(raw),
  type: (raw) => IssueType.create(raw),
  status: (raw) => IssueStatus.create(raw),
  priority: (raw) => IssuePriority.create(raw),
  description: (raw) => IssueDescription.create(raw),
  listPosition: parseListPosition,
  estimate: (raw) => parseOptionalHours(raw, 'Estimate'),
  timeSpent: (raw) => parseOptionalHours(raw, 'Time spent'),
  timeRemaining: (raw) => parseOptionalHours(raw, 'Time remaining'),
  reporterId: (raw) => parseEntityId(raw, 'reporter'),
  assigneeIds: (raw) => parseUserIdList(raw, 'Assignees'),
});

const parseChanges = (changes) => {
  const source = isPlainObject(changes) ? changes : {};
  const parsed = {};
  for (const [field, parse] of Object.entries(PARSERS)) {
    if (source[field] !== undefined) {
      parsed[field] = parse(source[field]);
    }
  }
  if (Object.keys(parsed).length === 0) {
    throw new ValidationError('No updatable fields provided');
  }
  return parsed;
};

export class UpdateIssue {
  #issueRepository;
  #projectAccess;

  constructor({ issueRepository, projectAccess }) {
    this.#issueRepository = issueRepository;
    this.#projectAccess = projectAccess;
  }

  async execute({ requesterId, projectId, issueId, changes }) {
    const { projectId: id } = await this.#projectAccess.requireMember({
      projectId,
      userId: requesterId,
    });
    const parsed = parseChanges(changes);

    const issue = await this.#issueRepository.findById({
      projectId: id,
      issueId: parseEntityId(issueId, 'issue'),
    });
    if (!issue) {
      throw new NotFoundError('Issue not found!');
    }

    const involvedUsers = [
      ...(parsed.reporterId ? [parsed.reporterId] : []),
      ...(parsed.assigneeIds ?? []),
    ];
    await this.#projectAccess.assertMembers({
      projectId: id,
      userIds: involvedUsers,
    });

    issue.update(parsed);
    const updated = await this.#issueRepository.update(issue);
    if (!updated) {
      throw new NotFoundError('Issue not found!');
    }
    return toIssueDto(issue);
  }
}
