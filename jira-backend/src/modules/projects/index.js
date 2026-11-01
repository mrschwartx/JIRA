import { ProjectAccess } from './application/project-access.js';
import { AddMember } from './application/use-cases/add-member.js';
import { CreateProject } from './application/use-cases/create-project.js';
import { DeleteProject } from './application/use-cases/delete-project.js';
import { GetProject } from './application/use-cases/get-project.js';
import { ListMembers } from './application/use-cases/list-members.js';
import { ListProjects } from './application/use-cases/list-projects.js';
import { RemoveMember } from './application/use-cases/remove-member.js';
import { UpdateProject } from './application/use-cases/update-project.js';
import { PostgresProjectRepository } from './infrastructure/postgres-project-repository.js';
import { createProjectsController } from './presentation/http/projects-controller.js';
import { createProjectsRouter } from './presentation/http/projects-router.js';

export const createProjectsModule = ({ pool, authenticate }) => {
  const projectRepository = new PostgresProjectRepository({ pool });
  const access = new ProjectAccess({ projectRepository });

  const useCases = {
    createProject: new CreateProject({ projectRepository }),
    listProjects: new ListProjects({ projectRepository }),
    getProject: new GetProject({ projectRepository, projectAccess: access }),
    updateProject: new UpdateProject({
      projectRepository,
      projectAccess: access,
    }),
    deleteProject: new DeleteProject({
      projectRepository,
      projectAccess: access,
    }),
    listMembers: new ListMembers({ projectRepository, projectAccess: access }),
    addMember: new AddMember({ projectRepository, projectAccess: access }),
    removeMember: new RemoveMember({
      projectRepository,
      projectAccess: access,
    }),
  };

  const router = createProjectsRouter({
    controller: createProjectsController(useCases),
    authenticate,
  });

  return { router, access, useCases };
};
