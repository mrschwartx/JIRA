import { toMemberDto } from '../project-dto.js';

export class ListMembers {
  #projectRepository;
  #projectAccess;

  constructor({ projectRepository, projectAccess }) {
    this.#projectRepository = projectRepository;
    this.#projectAccess = projectAccess;
  }

  async execute({ requesterId, projectId }) {
    const { projectId: id } = await this.#projectAccess.requireMember({
      projectId,
      userId: requesterId,
    });
    const members = await this.#projectRepository.listMembers(id);
    return members.map(toMemberDto);
  }
}
