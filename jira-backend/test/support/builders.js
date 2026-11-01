import { User } from '../../src/modules/users/domain/user.js';
import { Email } from '../../src/modules/users/domain/value-objects/email.js';
import { Username } from '../../src/modules/users/domain/value-objects/username.js';
import { Project } from '../../src/modules/projects/domain/project.js';
import { ProjectCategory } from '../../src/modules/projects/domain/value-objects/project-category.js';
import { ProjectDescription } from '../../src/modules/projects/domain/value-objects/project-description.js';
import { ProjectKey } from '../../src/modules/projects/domain/value-objects/project-key.js';
import { ProjectName } from '../../src/modules/projects/domain/value-objects/project-name.js';
import { ProjectUrl } from '../../src/modules/projects/domain/value-objects/project-url.js';
import { Issue } from '../../src/modules/issues/domain/issue.js';
import { IssueDescription } from '../../src/modules/issues/domain/value-objects/issue-description.js';
import { IssuePriority } from '../../src/modules/issues/domain/value-objects/issue-priority.js';
import { IssueStatus } from '../../src/modules/issues/domain/value-objects/issue-status.js';
import { IssueTitle } from '../../src/modules/issues/domain/value-objects/issue-title.js';
import { IssueType } from '../../src/modules/issues/domain/value-objects/issue-type.js';

export const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
export const OTHER_USER_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
export const PROJECT_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
export const ISSUE_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

const NOW = new Date('2026-01-01T00:00:00.000Z');

export const buildUser = (overrides = {}) =>
  User.register({
    id: USER_ID,
    username: Username.create('johndoe123'),
    email: Email.create('johndoe123@mail.com'),
    passwordHash: 'hashed:password123',
    now: NOW,
    ...overrides,
  });

export const buildProject = (overrides = {}) =>
  Project.create({
    id: PROJECT_ID,
    ownerId: USER_ID,
    key: ProjectKey.create('JIRA'),
    name: ProjectName.create('Jira Demo'),
    url: ProjectUrl.create('https://example.com'),
    description: ProjectDescription.create('A demo project'),
    category: ProjectCategory.create('software'),
    now: NOW,
    ...overrides,
  });

export const buildIssue = (overrides = {}) =>
  Issue.create({
    id: ISSUE_ID,
    projectId: PROJECT_ID,
    title: IssueTitle.create('Fix login redirect'),
    type: IssueType.create('bug'),
    status: IssueStatus.create('backlog'),
    priority: IssuePriority.create('high'),
    description: IssueDescription.create('Users land on a blank page'),
    estimate: null,
    timeSpent: null,
    timeRemaining: null,
    reporterId: USER_ID,
    assigneeIds: [],
    listPosition: 1,
    now: NOW,
    ...overrides,
  });
