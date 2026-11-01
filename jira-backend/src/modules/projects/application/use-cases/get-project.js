import { NotFoundError } from '../../../../shared/domain/errors.js';
import { toProjectDto } from '../project-dto.js';

export class GetProject {
  #projectRepository;
  #projectAccess;

  constructor({ projectRepository, projectAccess }) {
    this.#projectRepository = projectRepository;
    this.#projectAccess = projectAccess;
  }

  async execute({ requesterId, projectId }) {
    const { projectId: id, role } = await this.#projectAccess.requireMember({
      projectId,
      userId: requesterId,
    });
    const project = await this.#projectRepository.findById(id);
    if (!project) {
      throw new NotFoundError('Project not found!');
    }
    return toProjectDto(project, role);
  }
}
