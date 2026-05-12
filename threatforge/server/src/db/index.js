import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = path.resolve(
  process.cwd(),
  process.env.DATABASE_PATH || './data/threatforge.db'
);

// Ensure directory exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export const schemaPath = path.join(__dirname, 'schema.sql');

export function runSchema() {
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(sql);
}
