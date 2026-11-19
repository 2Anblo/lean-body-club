import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { loadConfig } from './config.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { groupsRouter } from './routes/groups.js';
import { checkInsRouter } from './routes/checkins.js';
import { errorHandler, notFoundRoute } from './middleware/errors.js';

/** Builds the Express app without connecting to the database or listening, so tests can use it directly. */
export function createApp(config = loadConfig()) {
  const app = express();

  // Behind Render / other proxies: use X-Forwarded-For for the client IP (rate limiting).
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: '50kb' }));

  const api = express.Router();

  // Health check for the host and for the CI smoke test. 503 while the database is down.
  api.get('/health', (_req, res) => {
    const db = mongoose.connection.readyState === 1 ? 'up' : 'down';
    res.status(db === 'up' ? 200 : 503).json({ status: db === 'up' ? 'ok' : 'degraded', db });
  });

  api.use('/auth', authRouter(config));
  api.use('/users', usersRouter(config));
  api.use('/groups', groupsRouter(config));
  api.use('/checkins', checkInsRouter(config));

  app.use('/api', api);
  app.use(notFoundRoute);
  app.use(errorHandler);
  return app;
}
