import { parseEntityId } from '../../../../shared/domain/entity-id.js';
import { Issue } from '../../domain/issue.js';
import { parseOptionalHours } from '../../domain/value-objects/hours.js';
import { IssueDescription } from '../../domain/value-objects/issue-description.js';
import { IssuePriority } from '../../domain/value-objects/issue-priority.js';
import { IssueStatus } from '../../domain/value-objects/issue-status.js';
import { IssueTitle } from '../../domain/value-objects/issue-title.js';
import { IssueType } from '../../domain/value-objects/issue-type.js';
import { toIssueDto } from '../issue-dto.js';
import { parseUserIdList } from '../parse-user-ids.js';

export class CreateIssue {
  #issueRepository;
  #projectAccess;

  constructor({ issueRepository, projectAccess }) {
    this.#issueRepository = issueRepository;
    this.#projectAccess = projectAccess;
  }

  async execute({ requesterId, projectId, input }) {
    const { projectId: id } = await this.#projectAccess.requireMember({
      projectId,
      userId: requesterId,
    });
    const source = input ?? {};

    const title = IssueTitle.create(source.title);
    const type = IssueType.create(source.type);
    const status = IssueStatus.create(source.status);
    const priority = IssuePriority.create(source.priority);
    const description = IssueDescription.create(source.description);
    const estimate = parseOptionalHours(source.estimate, 'Estimate');
    const timeSpent = parseOptionalHours(source.timeSpent, 'Time spent');
    const timeRemaining = parseOptionalHours(
      source.timeRemaining,
      'Time remaining'
    );
    const reporterId =
      source.reporterId === undefined
        ? requesterId
        : parseEntityId(source.reporterId, 'reporter');
    const assigneeIds =
      source.assigneeIds === undefined
        ? []
        : parseUserIdList(source.assigneeIds, 'Assignees');

    await this.#projectAccess.assertMembers({
      projectId: id,
      userIds: [reporterId, ...assigneeIds],
    });

    const lowest = await this.#issueRepository.minListPosition({
      projectId: id,
      status: status.value,
    });

    const issue = Issue.create({
      id: this.#issueRepository.nextId(),
      projectId: id,
      title,
      type,
      status,
      priority,
      description,
      estimate,
      timeSpent,
      timeRemaining,
      reporterId,
      assigneeIds,
      listPosition: lowest === null ? 1 : lowest - 1,
    });
    await this.#issueRepository.add(issue);
    return toIssueDto(issue);
  }
}
