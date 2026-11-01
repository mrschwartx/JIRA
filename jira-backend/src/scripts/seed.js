import 'dotenv/config';
import { createContainer } from '../bootstrap/create-container.js';
import { loadConfig } from '../config/env.js';
import { AlreadyExistsError } from '../shared/domain/errors.js';
import { createLogger } from '../shared/infrastructure/logging/logger.js';

const USERS = [
  {
    username: 'alice',
    email: 'alice@mail.com',
    password: 'password123',
  },
  {
    username: 'bob',
    email: 'bob@mail.com',
    password: 'password123',
  },
  {
    username: 'carol',
    email: 'carol@mail.com',
    password: 'password123',
  },
];

const PROJECT = {
  key: 'JIRA',
  name: 'Jira Demo',
  category: 'software',
  url: 'https://example.com',
  description: 'A sample project with issues spread across the board.',
};

const ISSUES = [
  {
    title: 'Set up continuous integration',
    type: 'task',
    status: 'done',
    priority: 'high',
    assignees: [0],
  },
  {
    title: 'Design the onboarding flow',
    type: 'story',
    status: 'done',
    priority: 'medium',
    assignees: [1],
  },
  {
    title: 'Fix login redirect loop',
    type: 'bug',
    status: 'inprogress',
    priority: 'highest',
    assignees: [0, 2],
  },
  {
    title: 'Add drag and drop to the board',
    type: 'story',
    status: 'inprogress',
    priority: 'high',
    assignees: [1],
  },
  {
    title: 'Write API documentation',
    type: 'task',
    status: 'selected',
    priority: 'medium',
    assignees: [2],
  },
  {
    title: 'Avatar upload fails for large files',
    type: 'bug',
    status: 'selected',
    priority: 'low',
    assignees: [],
  },
  {
    title: 'Support dark mode',
    type: 'story',
    status: 'backlog',
    priority: 'lowest',
    assignees: [],
  },
  {
    title: 'Improve search relevance',
    type: 'task',
    status: 'backlog',
    priority: 'medium',
    assignees: [0],
  },
];

const registerAll = async (users) => {
  const registered = [];
  for (const entry of USERS) {
    const { user } = await users.useCases.registerUser.execute(entry);
    registered.push(user);
  }
  return registered;
};

const seed = async () => {
  const config = loadConfig();
  const logger = createLogger(config);

  if (config.app.isProduction && process.env.SEED_ALLOW_PRODUCTION !== 'true') {
    logger.error('Refusing to seed a production database');
    process.exitCode = 1;
    return;
  }

  const container = await createContainer({ config, logger });
  const { users, projects, issues, comments } = container.modules;

  try {
    let people;
    try {
      people = await registerAll(users);
    } catch (error) {
      if (!(error instanceof AlreadyExistsError)) {
        throw error;
      }
      logger.warn('Seed data already exists, skipping');
      return;
    }

    const [owner, ...others] = people;
    const project = await projects.useCases.createProject.execute({
      requesterId: owner.id,
      input: PROJECT,
    });
    for (const member of others) {
      await projects.useCases.addMember.execute({
        requesterId: owner.id,
        projectId: project.id,
        userId: member.id,
      });
    }

    const created = [];
    for (const entry of [...ISSUES].reverse()) {
      const issue = await issues.useCases.createIssue.execute({
        requesterId: owner.id,
        projectId: project.id,
        input: {
          title: entry.title,
          type: entry.type,
          status: entry.status,
          priority: entry.priority,
          description: `Details for: ${entry.title}`,
          assigneeIds: entry.assignees.map((index) => people[index].id),
        },
      });
      created.push(issue);
    }

    await comments.useCases.createComment.execute({
      requesterId: others[0].id,
      projectId: project.id,
      issueId: created[0].id,
      input: { body: 'I can take a look at this tomorrow.' },
    });

    logger.info('Seeding completed');
  } finally {
    await container.close();
  }
};

try {
  await seed();
} catch (error) {
  console.error(`Seeding failed: ${error.message}`);
  process.exitCode = 1;
}
