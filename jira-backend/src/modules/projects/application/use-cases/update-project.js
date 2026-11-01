import {
  NotFoundError,
  ValidationError,
} from '../../../../shared/domain/errors.js';
import { ProjectCategory } from '../../domain/value-objects/project-category.js';
import { ProjectDescription } from '../../domain/value-objects/project-description.js';
import { ProjectName } from '../../domain/value-objects/project-name.js';
import { ProjectUrl } from '../../domain/value-objects/project-url.js';
import { toProjectDto } from '../project-dto.js';
import { assertProjectOwner } from './assert-project-owner.js';

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export class UpdateProject {
  #projectRepository;
  #projectAccess;

  constructor({ projectRepository, projectAccess }) {
    this.#projectRepository = projectRepository;
    this.#projectAccess = projectAccess;
  }

  async execute({ requesterId, projectId, changes }) {
    const { projectId: id, role } = await this.#projectAccess.requireMember({
      projectId,
      userId: requesterId,
    });
    assertProjectOwner(role, 'Only the project owner can update the project');

    const source = isPlainObject(changes) ? changes : {};
    const parsed = {
      name:
        source.name !== undefined ? ProjectName.create(source.name) : undefined,
      url: source.url !== undefined ? ProjectUrl.create(source.url) : undefined,
      description:
        source.description !== undefined
          ? ProjectDescription.create(source.description)
          : undefined,
      category:
        source.category !== undefined
          ? ProjectCategory.create(source.category)
          : undefined,
    };
    if (Object.values(parsed).every((value) => value === undefined)) {
      throw new ValidationError('No updatable fields provided');
    }

    const project = await this.#projectRepository.findById(id);
    if (!project) {
      throw new NotFoundError('Project not found!');
    }
    project.update(parsed);
    const updated = await this.#projectRepository.update(project);
    if (!updated) {
      throw new NotFoundError('Project not found!');
    }
    return toProjectDto(project, role);
  }
}
