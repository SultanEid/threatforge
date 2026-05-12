import { runSchema, db } from './index.js';

console.log('[migrate] Applying schema…');
runSchema();

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('[migrate] Tables present:', tables.map((t) => t.name).join(', '));
console.log('[migrate] Done.');
