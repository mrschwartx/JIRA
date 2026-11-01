import { parseEntityId } from '../../../shared/domain/entity-id.js';
import {
  NotFoundError,
  ValidationError,
} from '../../../shared/domain/errors.js';

export class ProjectAccess {
  #projectRepository;

  constructor({ projectRepository }) {
    this.#projectRepository = projectRepository;
  }

  async requireMember({ projectId, userId }) {
    const id = parseEntityId(projectId, 'project');
    const membership = await this.#projectRepository.findMembership({
      projectId: id,
      userId,
    });
    if (!membership) {
      throw new NotFoundError('Project not found!');
    }
    return { projectId: id, role: membership.role };
  }

  async assertMembers({ projectId, userIds }) {
    const unique = [...new Set(userIds)];
    if (unique.length === 0) {
      return;
    }
    const memberIds = await this.#projectRepository.filterMemberIds({
      projectId,
      userIds: unique,
    });
    if (memberIds.length !== unique.length) {
      throw new ValidationError('Users must be members of the project');
    }
  }
}
