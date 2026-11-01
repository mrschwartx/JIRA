import { toProjectDto } from '../project-dto.js';

export class ListProjects {
  #projectRepository;

  constructor({ projectRepository }) {
    this.#projectRepository = projectRepository;
  }

  async execute({ requesterId }) {
    const entries = await this.#projectRepository.listByMember(requesterId);
    return entries.map(({ project, role }) => toProjectDto(project, role));
  }
}
