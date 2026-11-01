import { NotFoundError } from '../../../../shared/domain/errors.js';
import { assertProjectOwner } from './assert-project-owner.js';

export class DeleteProject {
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
    assertProjectOwner(role, 'Only the project owner can delete the project');

    const deleted = await this.#projectRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundError('Project not found!');
    }
  }
}
