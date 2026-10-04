import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

import authRouter from './routes/auth.js';
import projectsRouter from './routes/projects.js';
import nodesRouter from './routes/nodes.js';
import edgesRouter from './routes/edges.js';
import threatsRouter from './routes/threats.js';
import { requireAuth } from './lib/auth.js';
import { errorHandler, notFound } from './middleware/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');

export function createApp() {
  const app = express();

  // Session cookies are credentials: only the configured client origin may
  // make credentialed cross-origin requests. In dev the Vite proxy makes
  // requests same-origin, so this only matters for split deployments.
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('dev'));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

  app.use('/api/auth', authRouter);
  app.use('/api', requireAuth);
  app.use('/api/projects', projectsRouter);
  app.use('/api', nodesRouter);
  app.use('/api', edgesRouter);
  app.use('/api', threatsRouter);
  app.use('/api', notFound);

  // Production: serve the built client and fall back to index.html.
  if (fs.existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST));
    app.get('*', (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
