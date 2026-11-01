import { parseEntityId } from '../../../../shared/domain/entity-id.js';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../../shared/domain/errors.js';
import { MEMBER_ROLES } from '../../domain/member-role.js';

export class RemoveMember {
  #projectRepository;
  #projectAccess;

  constructor({ projectRepository, projectAccess }) {
    this.#projectRepository = projectRepository;
    this.#projectAccess = projectAccess;
  }

  async execute({ requesterId, projectId, userId }) {
    const { projectId: id, role } = await this.#projectAccess.requireMember({
      projectId,
      userId: requesterId,
    });
    const memberId = parseEntityId(userId, 'user');

    const isSelf = memberId === requesterId;
    if (role !== MEMBER_ROLES.OWNER && !isSelf) {
      throw new ForbiddenError('Only the project owner can remove members');
    }

    const target = await this.#projectRepository.findMembership({
      projectId: id,
      userId: memberId,
    });
    if (!target) {
      throw new NotFoundError('Member not found!');
    }
    if (target.role === MEMBER_ROLES.OWNER) {
      throw new ValidationError('The project owner cannot be removed');
    }

    await this.#projectRepository.removeMember({
      projectId: id,
      userId: memberId,
    });
  }
}
