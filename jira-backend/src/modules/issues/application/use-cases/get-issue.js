import { parseEntityId } from '../../../../shared/domain/entity-id.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { toIssueDto } from '../issue-dto.js';

export class GetIssue {
  #issueRepository;
  #projectAccess;

  constructor({ issueRepository, projectAccess }) {
    this.#issueRepository = issueRepository;
    this.#projectAccess = projectAccess;
  }

  async execute({ requesterId, projectId, issueId }) {
    const { projectId: id } = await this.#projectAccess.requireMember({
      projectId,
      userId: requesterId,
    });
    const issue = await this.#issueRepository.findById({
      projectId: id,
      issueId: parseEntityId(issueId, 'issue'),
    });
    if (!issue) {
      throw new NotFoundError('Issue not found!');
    }
    return toIssueDto(issue);
  }
}
