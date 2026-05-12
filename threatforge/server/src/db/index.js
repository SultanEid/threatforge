// SQLite layer built on Node's built-in node:sqlite (Node 22.5+).
// Exposes a small wrapper that mimics the better-sqlite3 API surface
// (prepare/run/get/all, exec, pragma, transaction) so the rest of the
// codebase stays portable. Two normalizations are applied:
//   1. undefined bind values are coerced to null (node:sqlite rejects undefined).
//   2. SQL `@name` named placeholders are rewritten to `$name` so we can pass
//      plain `{name: value}` objects the way better-sqlite3 expects.

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = path.resolve(
  process.cwd(),
  process.env.DATABASE_PATH || './data/threatforge.db'
);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const _db = new DatabaseSync(dbPath);

// ---------- Helpers ----------
// node:sqlite rejects undefined; coerce to null.
function nullify(v) {
  return v === undefined ? null : v;
}

// Normalize positional + named param bindings.
// - If a single plain object is passed, treat as named params: prefix keys with `$`
//   and apply nullify to all values.
// - Otherwise treat all args as positional and nullify each.
function normalizeBindArgs(args) {
  if (
    args.length === 1 &&
    args[0] !== null &&
    typeof args[0] === 'object' &&
    !Array.isArray(args[0]) &&
    !Buffer.isBuffer(args[0])
  ) {
    const obj = args[0];
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const key = k.startsWith('$') ? k : `$${k}`;
      out[key] = nullify(v);
    }
    return [out];
  }
  if (args.length === 1 && Array.isArray(args[0])) {
    return args[0].map(nullify);
  }
  return args.map(nullify);
}

// Rewrite `@name` placeholders to `$name` so SQL written for better-sqlite3 keeps working.
// Walks the string and skips characters inside single-quoted strings and double-quoted identifiers.
function rewriteNamedParams(sql) {
  if (sql.indexOf('@') === -1) return sql;

  let out = '';
  let i = 0;
  let inSingle = false;
  let inDouble = false;
  while (i < sql.length) {
    const ch = sql[i];
    if (!inSingle && !inDouble && ch === '@') {
      let j = i + 1;
      while (j < sql.length && /[A-Za-z0-9_]/.test(sql[j])) j++;
      if (j > i + 1) {
        out += '$' + sql.slice(i + 1, j);
        i = j;
        continue;
      }
    }
    if (!inDouble && ch === "'") inSingle = !inSingle;
    else if (!inSingle && ch === '"') inDouble = !inDouble;
    out += ch;
    i++;
  }
  return out;
}

// ---------- Statement wrapper ----------
function wrapStatement(stmt) {
  return {
    run: (...args) => stmt.run(...normalizeBindArgs(args)),
    get: (...args) => stmt.get(...normalizeBindArgs(args)),
    all: (...args) => stmt.all(...normalizeBindArgs(args)),
  };
}

// ---------- Pragma helper ----------
function pragma(stmt) {
  _db.exec(`PRAGMA ${stmt}`);
}

// ---------- Transaction helper ----------
function transaction(fn) {
  return (...args) => {
    _db.exec('BEGIN');
    try {
      const out = fn(...args);
      _db.exec('COMMIT');
      return out;
    } catch (err) {
      try { _db.exec('ROLLBACK'); } catch { /* ignore */ }
      throw err;
    }
  };
}

// ---------- Public DB object ----------
export const db = {
  prepare: (sql) => wrapStatement(_db.prepare(rewriteNamedParams(sql))),
  exec: (sql) => _db.exec(sql),
  pragma,
  transaction,
  close: () => _db.close(),
};

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------- Schema runner ----------
export const schemaPath = path.join(__dirname, 'schema.sql');

export function runSchema() {
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(sql);
}
