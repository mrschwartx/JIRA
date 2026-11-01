import { Project } from '../../domain/project.js';
import { MEMBER_ROLES } from '../../domain/member-role.js';
import { ProjectCategory } from '../../domain/value-objects/project-category.js';
import { ProjectDescription } from '../../domain/value-objects/project-description.js';
import { ProjectKey } from '../../domain/value-objects/project-key.js';
import { ProjectName } from '../../domain/value-objects/project-name.js';
import { ProjectUrl } from '../../domain/value-objects/project-url.js';
import { toProjectDto } from '../project-dto.js';

export class CreateProject {
  #projectRepository;

  constructor({ projectRepository }) {
    this.#projectRepository = projectRepository;
  }

  async execute({ requesterId, input }) {
    const source = input ?? {};
    const project = Project.create({
      id: this.#projectRepository.nextId(),
      ownerId: requesterId,
      key: ProjectKey.create(source.key),
      name: ProjectName.create(source.name),
      url: ProjectUrl.create(source.url),
      description: ProjectDescription.create(source.description),
      category: ProjectCategory.create(source.category),
    });
    await this.#projectRepository.add(project);
    return toProjectDto(project, MEMBER_ROLES.OWNER);
  }
}
