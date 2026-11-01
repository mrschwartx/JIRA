import { createCommentsModule } from '../modules/comments/index.js';
import { createIssuesModule } from '../modules/issues/index.js';
import { createProjectsModule } from '../modules/projects/index.js';
import { createUsersModule } from '../modules/users/index.js';
import { InMemoryEventBus } from '../shared/infrastructure/events/in-memory-event-bus.js';
import { runMigrations } from '../shared/infrastructure/postgres/migrator.js';
import { PostgresConnection } from '../shared/infrastructure/postgres/postgres-connection.js';

export const createContainer = async ({ config, logger }) => {
  const database = new PostgresConnection({ ...config.database, logger });

  try {
    const pool = await database.connect();
    await runMigrations(pool, { logger });

    const eventBus = new InMemoryEventBus({ logger });
    const users = createUsersModule({ pool, config, logger, eventBus });
    const projects = createProjectsModule({
      pool,
      authenticate: users.authenticate,
    });
    const issues = createIssuesModule({
      pool,
      authenticate: users.authenticate,
      projectAccess: projects.access,
    });
    const comments = createCommentsModule({
      pool,
      authenticate: users.authenticate,
      projectAccess: projects.access,
      issueGateway: issues.gateway,
    });

    return {
      config,
      logger,
      eventBus,
      modules: { users, projects, issues, comments },
      close: () => database.close(),
    };
  } catch (error) {
    await database.close();
    throw error;
  }
};
