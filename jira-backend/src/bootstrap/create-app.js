import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { createErrorHandler } from '../shared/infrastructure/http/error-handler.js';
import { notFoundHandler } from '../shared/infrastructure/http/not-found-handler.js';
import { createRequestLogger } from '../shared/infrastructure/http/request-logger.js';

const createAuthLimiter = ({ auth }) =>
  rateLimit({
    windowMs: auth.rateLimitWindowMs,
    limit: auth.rateLimitMax,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({
        status: 429,
        message: 'Too many attempts. Please try again later.',
      }),
  });

export const createApp = ({ config, logger, modules }) => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.app.trustProxy);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(createRequestLogger({ logger }));
  app.use(
    express.static(config.storage.publicDir, {
      setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
    })
  );

  app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the Jira API' });
  });

  const authLimiter = createAuthLimiter(config);
  app.use('/api/v1/auth/signin', authLimiter);
  app.use('/api/v1/auth/signup', authLimiter);

  app.use('/api/v1/auth', modules.users.authRouter);
  app.use('/api/v1/users', modules.users.usersRouter);
  app.use('/api/v1/projects', modules.projects.router);
  app.use('/api/v1/projects/:projectId/issues', modules.issues.router);
  app.use(
    '/api/v1/projects/:projectId/issues/:issueId/comments',
    modules.comments.router
  );

  app.use(notFoundHandler);
  app.use(createErrorHandler({ logger }));

  return app;
};
