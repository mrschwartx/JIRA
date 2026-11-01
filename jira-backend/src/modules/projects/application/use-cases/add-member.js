import { parseEntityId } from '../../../../shared/domain/entity-id.js';
import { MEMBER_ROLES } from '../../domain/member-role.js';
import { toMemberDto } from '../project-dto.js';
import { assertProjectOwner } from './assert-project-owner.js';

export class AddMember {
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
    assertProjectOwner(role, 'Only the project owner can add members');
    const memberId = parseEntityId(userId, 'user');

    await this.#projectRepository.addMember({
      projectId: id,
      userId: memberId,
      role: MEMBER_ROLES.MEMBER,
    });
    const members = await this.#projectRepository.listMembers(id);
    return toMemberDto(members.find((member) => member.id === memberId));
  }
}
