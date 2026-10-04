// Password hashing, session cookies and the requireAuth middleware.
// Passwords: scrypt with a per-user random salt. Sessions: a random 256-bit
// token in an httpOnly cookie; only its SHA-256 is stored server-side.
import crypto from 'node:crypto';
import { db } from '../db/index.js';
import { HttpError } from '../middleware/error.js';

export const SESSION_COOKIE = 'tf_session';
const SESSION_DAYS = 30;
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

// ---------- Passwords ----------
export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  const [alg, N, r, p, saltB64, hashB64] = String(stored).split('$');
  if (alg !== 'scrypt' || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length,
    { N: Number(N), r: Number(r), p: Number(p) });
  return crypto.timingSafeEqual(actual, expected);
}

// Run a hash anyway for unknown emails so response timing doesn't reveal
// which accounts exist.
const DUMMY_HASH = hashPassword(crypto.randomBytes(16).toString('hex'));
export function verifyAgainstDummy(password) {
  verifyPassword(password, DUMMY_HASH);
}

// ---------- Sessions ----------
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

export function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  db.prepare(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)`)
    .run(sha256(token), userId, expires.toISOString());
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires,
    path: '/',
  });
}

export function destroySession(req, res) {
  const token = readCookie(req, SESSION_COOKIE);
  if (token) db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(sha256(token));
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) {
      try { return decodeURIComponent(part.slice(i + 1).trim()); } catch { return null; }
    }
  }
  return null;
}

export const publicUser = (u) => ({
  id: u.id, email: u.email, name: u.name, affiliation: u.affiliation, created_at: u.created_at,
});

// Attaches req.user or responds 401.
export function requireAuth(req, _res, next) {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return next(new HttpError(401, 'Not signed in'));
  const row = db.prepare(`
    SELECT u.*, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?`).get(sha256(token));
  if (!row || new Date(row.expires_at) < new Date()) {
    if (row) db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(sha256(token));
    return next(new HttpError(401, 'Session expired'));
  }
  req.user = publicUser(row);
  next();
}

// ---------- Login throttling ----------
// In-memory: at most MAX_FAILS failed attempts per (ip, email) per window.
const WINDOW_MS = 15 * 60e3;
const MAX_FAILS = 10;
const fails = new Map();

export function checkThrottle(key) {
  const f = fails.get(key);
  if (f && f.until > Date.now() && f.count >= MAX_FAILS) {
    throw new HttpError(429, 'Too many failed sign-in attempts. Try again in a few minutes.');
  }
}
export function recordFailure(key) {
  const f = fails.get(key);
  if (!f || f.until < Date.now()) fails.set(key, { count: 1, until: Date.now() + WINDOW_MS });
  else f.count++;
}
export function clearFailures(key) {
  fails.delete(key);
}
