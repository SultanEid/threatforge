// Wraps async route handlers so thrown errors hit the error middleware.
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(_req, res) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err, _req, res, _next) {
  // Surface SQLite constraint failures (CHECK, FK, UNIQUE...) as 400s.
  // node:sqlite reports code 'ERR_SQLITE_ERROR' with the SQLite result code in
  // `errcode`; the primary code SQLITE_CONSTRAINT is 19 (low byte of extended codes).
  const isConstraint = err && (
    (err.code === 'ERR_SQLITE_ERROR' && (err.errcode & 0xff) === 19) ||
    String(err.code).startsWith('SQLITE_CONSTRAINT')
  );
  const status = err.status || (isConstraint ? 400 : 500);
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ error: err.message || 'Internal Server Error' });
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
