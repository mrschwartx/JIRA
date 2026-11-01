import { startServer } from '../../src/bootstrap/start-server.js';
import { createLogger } from '../../src/shared/infrastructure/logging/logger.js';
import { createHttpClient } from './http-client.js';
import {
  createTempPublicDir,
  createTestConfig,
  removeDir,
} from './test-config.js';

export const startTestApp = async ({ databaseUrl, overrides = {} }) => {
  const publicDir = createTempPublicDir();
  const config = createTestConfig({
    DATABASE_URL: databaseUrl,
    PUBLIC_DIR: publicDir,
    ...overrides,
  });
  const logger = createLogger(config);
  const instance = await startServer({ config, logger });
  const baseUrl = `http://127.0.0.1:${instance.port}`;

  return {
    ...instance,
    config,
    publicDir,
    baseUrl,
    createClient: () => createHttpClient(baseUrl),
    stop: async () => {
      await instance.stop();
      removeDir(publicDir);
    },
  };
};

export const registerUser = async (client, overrides = {}) => {
  const credentials = {
    username: `user_${Math.random().toString(36).slice(2, 10)}`,
    email: `${Math.random().toString(36).slice(2, 10)}@mail.com`,
    password: 'Password123!',
    ...overrides,
  };
  const response = await client.post('/api/v1/auth/signup', {
    json: credentials,
  });
  return { credentials, response, user: response.body };
};

export const projectPayload = (overrides = {}) => ({
  key: `K${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  name: 'Jira Demo',
  category: 'software',
  description: 'A demo project',
  ...overrides,
});

export const issuePayload = (overrides = {}) => ({
  title: 'Fix login redirect',
  type: 'bug',
  status: 'backlog',
  priority: 'high',
  description: 'Users land on a blank page',
  ...overrides,
});

export const createProject = async (client, overrides = {}) => {
  const response = await client.post('/api/v1/projects', {
    json: projectPayload(overrides),
  });
  return response.body;
};

export const createIssue = async (client, projectId, overrides = {}) => {
  const response = await client.post(`/api/v1/projects/${projectId}/issues`, {
    json: issuePayload(overrides),
  });
  return response.body;
};
