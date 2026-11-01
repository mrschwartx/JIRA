import { parseEntityId } from '../../../shared/domain/entity-id.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export class IssueGateway {
  #issueRepository;

  constructor({ issueRepository }) {
    this.#issueRepository = issueRepository;
  }

  async assertExists({ projectId, issueId }) {
    const id = parseEntityId(issueId, 'issue');
    const exists = await this.#issueRepository.exists({
      projectId,
      issueId: id,
    });
    if (!exists) {
      throw new NotFoundError('Issue not found!');
    }
    return id;
  }
}
