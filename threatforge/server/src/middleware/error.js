// Wraps async route handlers so thrown errors hit the error middleware.
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(_req, res) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err, _req, res, _next) {
  // Surface SQLite constraint failures as 400s
  const isSqlite = err && err.code && String(err.code).startsWith('SQLITE_');
  const status = err.status || (isSqlite ? 400 : 500);
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ error: err.message || 'Internal Server Error' });
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
