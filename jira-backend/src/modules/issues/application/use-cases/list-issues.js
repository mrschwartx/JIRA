import { parseEntityId } from '../../../../shared/domain/entity-id.js';
import { ValidationError } from '../../../../shared/domain/errors.js';
import { IssueStatus } from '../../domain/value-objects/issue-status.js';
import { IssueType } from '../../domain/value-objects/issue-type.js';
import { toIssueDto } from '../issue-dto.js';

export const ISSUES_LIMIT = 1000;
const MAX_SEARCH_LENGTH = 100;

const assertOptionalString = (value, label) => {
  if (value !== undefined && typeof value !== 'string') {
    throw new ValidationError(`${label} filter must be a string`);
  }
};

export class ListIssues {
  #issueRepository;
  #projectAccess;

  constructor({ issueRepository, projectAccess }) {
    this.#issueRepository = issueRepository;
    this.#projectAccess = projectAccess;
  }

  async execute({ requesterId, projectId, search, status, type, assigneeId }) {
    const { projectId: id } = await this.#projectAccess.requireMember({
      projectId,
      userId: requesterId,
    });
    for (const [value, label] of [
      [search, 'Search'],
      [status, 'Status'],
      [type, 'Type'],
      [assigneeId, 'Assignee'],
    ]) {
      assertOptionalString(value, label);
    }

    const term = search?.trim();
    if (term && term.length > MAX_SEARCH_LENGTH) {
      throw new ValidationError(
        `Search must not exceed ${MAX_SEARCH_LENGTH} characters`
      );
    }

    const issues = await this.#issueRepository.list({
      projectId: id,
      search: term || undefined,
      status: status ? IssueStatus.create(status).value : undefined,
      type: type ? IssueType.create(type).value : undefined,
      assigneeId: assigneeId
        ? parseEntityId(assigneeId, 'assignee')
        : undefined,
      limit: ISSUES_LIMIT,
    });
    return issues.map(toIssueDto);
  }
}
