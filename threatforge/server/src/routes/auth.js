import { Router } from 'express';
import { db } from '../db/index.js';
import { idFor } from '../lib/uid.js';
import { ah, HttpError } from '../middleware/error.js';
import {
  hashPassword, verifyPassword, verifyAgainstDummy, createSession, destroySession,
  requireAuth, publicUser, checkThrottle, recordFailure, clearFailures,
} from '../lib/auth.js';

const r = Router();
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const str = (v) => (typeof v === 'string' ? v.trim() : '');

// POST /api/auth/signup
r.post('/signup', ah(async (req, res) => {
  const name = str(req.body?.name);
  const email = str(req.body?.email).toLowerCase();
  const affiliation = str(req.body?.affiliation) || null;
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!name) throw new HttpError(400, 'Full name is required.');
  if (!EMAIL_RX.test(email)) throw new HttpError(400, 'Enter a valid email address.');
  if (password.length < MIN_PASSWORD) throw new HttpError(400, `Password must be at least ${MIN_PASSWORD} characters.`);
  if (db.prepare(`SELECT 1 FROM users WHERE email = ?`).get(email)) {
    throw new HttpError(409, 'An account with this email already exists. Sign in instead.');
  }

  const id = idFor('usr');
  db.prepare(`INSERT INTO users (id, email, name, affiliation, password_hash) VALUES (?, ?, ?, ?, ?)`)
    .run(id, email, name, affiliation, hashPassword(password));
  createSession(res, id);
  res.status(201).json(publicUser(db.prepare(`SELECT * FROM users WHERE id = ?`).get(id)));
}));

// POST /api/auth/login
r.post('/login', ah(async (req, res) => {
  const email = str(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password) throw new HttpError(400, 'Enter your email and password.');

  const key = `${req.ip}|${email}`;
  checkThrottle(key);
  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
  if (!user) verifyAgainstDummy(password);
  if (!user || !verifyPassword(password, user.password_hash)) {
    recordFailure(key);
    throw new HttpError(401, 'Incorrect email or password.');
  }
  clearFailures(key);
  createSession(res, user.id);
  res.json(publicUser(user));
}));

// POST /api/auth/logout
r.post('/logout', (req, res) => {
  destroySession(req, res);
  res.status(204).end();
});

// GET /api/auth/me
r.get('/me', requireAuth, (req, res) => res.json(req.user));

// PUT /api/auth/me  (profile: name, affiliation)
r.put('/me', requireAuth, ah(async (req, res) => {
  const name = req.body?.name !== undefined ? str(req.body.name) : undefined;
  if (name === '') throw new HttpError(400, 'Full name is required.');
  const affiliation = req.body?.affiliation !== undefined ? (str(req.body.affiliation) || null) : undefined;
  db.prepare(`UPDATE users SET
      name = COALESCE(?, name),
      affiliation = CASE WHEN ? THEN ? ELSE affiliation END,
      updated_at = datetime('now')
    WHERE id = ?`).run(name ?? null, affiliation !== undefined ? 1 : 0, affiliation ?? null, req.user.id);
  res.json(publicUser(db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.id)));
}));

export default r;
