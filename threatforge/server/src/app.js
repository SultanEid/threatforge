import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';

import projectsRouter from './routes/projects.js';
import nodesRouter from './routes/nodes.js';
import edgesRouter from './routes/edges.js';
import threatsRouter from './routes/threats.js';
import { errorHandler, notFound } from './middleware/error.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('dev'));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

  app.use('/api/projects', projectsRouter);
  app.use('/api', nodesRouter);
  app.use('/api', edgesRouter);
  app.use('/api', threatsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
