import { initDb } from '../src/lib/db';
import { syncMarkdownToSqlite } from '../src/lib/sync';

const db = initDb();
const result = syncMarkdownToSqlite();

console.log('Sync result:', JSON.stringify(result, null, 2));

const count = db.prepare('SELECT COUNT(*) as cnt FROM entities').get() as {
  cnt: number;
};
console.log('Total entities in SQLite:', count.cnt);

const rows = db.prepare('SELECT id, type, title FROM entities').all();
console.log('Entities:', JSON.stringify(rows, null, 2));
