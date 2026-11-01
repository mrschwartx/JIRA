import { IssueGateway } from './application/issue-gateway.js';
import { CreateIssue } from './application/use-cases/create-issue.js';
import { DeleteIssue } from './application/use-cases/delete-issue.js';
import { GetIssue } from './application/use-cases/get-issue.js';
import { ListIssues } from './application/use-cases/list-issues.js';
import { UpdateIssue } from './application/use-cases/update-issue.js';
import { PostgresIssueRepository } from './infrastructure/postgres-issue-repository.js';
import { createIssuesController } from './presentation/http/issues-controller.js';
import { createIssuesRouter } from './presentation/http/issues-router.js';

export const createIssuesModule = ({ pool, authenticate, projectAccess }) => {
  const issueRepository = new PostgresIssueRepository({ pool });

  const useCases = {
    createIssue: new CreateIssue({ issueRepository, projectAccess }),
    listIssues: new ListIssues({ issueRepository, projectAccess }),
    getIssue: new GetIssue({ issueRepository, projectAccess }),
    updateIssue: new UpdateIssue({ issueRepository, projectAccess }),
    deleteIssue: new DeleteIssue({ issueRepository, projectAccess }),
  };

  const router = createIssuesRouter({
    controller: createIssuesController(useCases),
    authenticate,
  });

  return {
    router,
    useCases,
    gateway: new IssueGateway({ issueRepository }),
  };
};
