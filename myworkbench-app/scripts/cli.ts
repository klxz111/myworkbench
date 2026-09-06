#!/usr/bin/env node
/**
 * myworkbench CLI
 *
 * Usage:
 *   tsx scripts/cli.ts new <type> <slug> [title]
 *   tsx scripts/cli.ts search <query>
 *   tsx scripts/cli.ts link <from> <to> [relation]
 *   tsx scripts/cli.ts sync
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import matter from 'gray-matter';
import { initDb, getDb } from '../src/lib/db';
import { syncMarkdownToSqlite } from '../src/lib/sync';
import {
  EntityType,
  ENTITY_DIRS,
  writeEntity,
  readEntity,
  getEntityRoot,
  resolveEntityPath,
  EntityFrontmatter,
} from '../src/lib/markdown';

function generateId(seed: string): string {
  return crypto.createHash('md5').update(seed + Date.now().toString()).digest('hex').slice(0, 12);
}

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function ensureSync() {
  const db = initDb();
  const root = getEntityRoot();
  if (!fs.existsSync(root)) {
    return 0;
  }
  const result = syncMarkdownToSqlite();
  return result.scanned;
}

function cmdNew(type: string, slug: string, title?: string) {
  if (!ENTITY_DIRS[type as EntityType]) {
    console.error(`Error: Unknown entity type "${type}"`);
    console.error(`Valid types: ${Object.keys(ENTITY_DIRS).join(', ')}`);
    process.exit(1);
  }

  const entityType = type as EntityType;
  const filePath = resolveEntityPath(entityType, slug);

  if (fs.existsSync(filePath)) {
    console.error(`Error: Entity already exists at ${filePath}`);
    process.exit(1);
  }

  const id = slug;
  const entityTitle = title || slugToTitle(slug);
  const now = new Date().toISOString();

  const data: EntityFrontmatter = {
    id,
    type: entityType,
    title: entityTitle,
    status: 'draft',
    tags: [],
    created_at: now,
    updated_at: now,
  };

  const content = `# ${entityTitle}\n\n`;

  writeEntity(entityType, slug, data, content);
  console.log(`Created Markdown: ${filePath}`);

  const scanned = ensureSync();
  console.log(`Synced to SQLite (scanned: ${scanned})`);
  console.log(`ID: ${id}`);
}

function cmdSearch(query: string) {
  const db = initDb();

  const rows = db.prepare(
    `
    SELECT e.type, e.title, e.slug, e.content
    FROM entities_fts
    JOIN entities e ON e.rowid = entities_fts.rowid
    WHERE entities_fts MATCH ?
    ORDER BY bm25(entities_fts)
    `
  ).all(query) as any[];

  if (rows.length === 0) {
    console.log('No results found.');
    return;
  }

  console.log(`Results for "${query}":\n`);
  for (const row of rows) {
    const title = row.title;
    const content = row.content || '';
    const lowerQ = query.toLowerCase();
    let snippet = '';

    if (title.toLowerCase().includes(lowerQ)) {
      snippet = title;
    } else {
      const lowerContent = content.toLowerCase();
      const index = lowerContent.indexOf(lowerQ);
      if (index >= 0) {
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + query.length + 50);
        snippet =
          (start > 0 ? '...' : '') +
          content.slice(start, end) +
          (end < content.length ? '...' : '');
      }
    }

    console.log(`[${row.type}] ${title} (${row.slug})`);
    console.log(`  ${snippet}`);
    console.log();
  }
}

function cmdLink(from: string, to: string, relation = 'related') {
  const db = initDb();

  const fromEntity = db.prepare('SELECT id, type, slug, title FROM entities WHERE slug = ? OR id = ?').get(from, from) as any;
  const toEntity = db.prepare('SELECT id, type, slug, title FROM entities WHERE slug = ? OR id = ?').get(to, to) as any;

  if (!fromEntity) {
    console.error(`Error: Entity "${from}" not found in database. Run sync first.`);
    process.exit(1);
  }
  if (!toEntity) {
    console.error(`Error: Entity "${to}" not found in database. Run sync first.`);
    process.exit(1);
  }

  try {
    db.prepare(
      'INSERT OR IGNORE INTO relations (from_id, to_id, relation) VALUES (?, ?, ?)'
    ).run(fromEntity.id, toEntity.id, relation);
    console.log(`Linked: ${fromEntity.title} (${fromEntity.slug}) ->[${relation}]-> ${toEntity.title} (${toEntity.slug})`);
  } catch (error) {
    console.error('Error linking entities:', error);
    process.exit(1);
  }
}

function cmdSync() {
  console.log('Syncing Markdown to SQLite...');
  const result = syncMarkdownToSqlite();
  console.log('Sync complete:', JSON.stringify(result, null, 2));
}

function printHelp() {
  console.log(`
myworkbench CLI

Usage:
  cli new <type> <slug> [title]    Create a new entity
  cli search <query>                Search entities
  cli link <from> <to> [relation]   Link two entities
  cli sync                          Sync Markdown to SQLite

Entity types:
  ${Object.keys(ENTITY_DIRS).join(', ')}

Examples:
  cli new research my-first-research
  cli new strategy my-strategy "My Strategy"
  cli search "machine learning"
  cli link research-my-first-research decision-my-decision supports
  cli sync
  `);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }

  switch (command) {
    case 'new':
      if (args.length < 3) {
        console.error('Usage: cli new <type> <slug> [title]');
        process.exit(1);
      }
      cmdNew(args[1], args[2], args[3]);
      break;

    case 'search':
      if (args.length < 2) {
        console.error('Usage: cli search <query>');
        process.exit(1);
      }
      cmdSearch(args.slice(1).join(' '));
      break;

    case 'link':
      if (args.length < 3) {
        console.error('Usage: cli link <from> <to> [relation]');
        process.exit(1);
      }
      cmdLink(args[1], args[2], args[3] || 'related');
      break;

    case 'sync':
      cmdSync();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main();
