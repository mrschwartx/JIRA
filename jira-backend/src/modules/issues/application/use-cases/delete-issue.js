import { parseEntityId } from '../../../../shared/domain/entity-id.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';

export class DeleteIssue {
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
    const deleted = await this.#issueRepository.deleteById({
      projectId: id,
      issueId: parseEntityId(issueId, 'issue'),
    });
    if (!deleted) {
      throw new NotFoundError('Issue not found!');
    }
  }
}
