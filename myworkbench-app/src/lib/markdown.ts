import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export type EntityType =
  | 'strategy'
  | 'research'
  | 'decision'
  | 'project'
  | 'experiment'
  | 'person'
  | 'evidence'
  | 'opportunity'
  | 'radar'
  | 'capital';

export const ENTITY_DIRS: Record<EntityType, string> = {
  strategy: 'strategy',
  research: 'research',
  decision: 'decisions',
  project: 'projects',
  experiment: 'experiments',
  person: 'people',
  evidence: 'evidence',
  opportunity: 'opportunities',
  radar: 'radar',
  capital: 'capital',
};

export interface EntityFrontmatter {
  id: string;
  type: EntityType;
  title: string;
  status?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface EntityFile {
  id: string;
  type: EntityType;
  slug: string;
  filePath: string;
  frontmatter: EntityFrontmatter;
  content: string;
}

export function getEntityRoot(): string {
  if (process.env.MYWORKBENCH_ENTITIES) {
    return process.env.MYWORKBENCH_ENTITIES;
  }
  if (process.env.MYWORKBENCH_DIR) {
    return path.join(process.env.MYWORKBENCH_DIR, 'entities');
  }
  const cwd = process.cwd();
  if (cwd.endsWith('myworkbench-app')) {
    return path.join(cwd, '..', 'entities');
  }
  return path.join(cwd, 'entities');
}

export function getEntityDir(type: EntityType): string {
  return path.join(getEntityRoot(), ENTITY_DIRS[type]);
}

export function resolveEntityPath(type: EntityType, slug: string): string {
  return path.join(getEntityDir(type), `${slug}.md`);
}

export function readEntity(type: EntityType, slug: string): EntityFile | null {
  const filePath = resolveEntityPath(type, slug);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = matter(raw);

  return {
    id: parsed.data.id as string,
    type,
    slug,
    filePath,
    frontmatter: parsed.data as EntityFrontmatter,
    content: parsed.content,
  };
}

export function writeEntity(
  type: EntityType,
  slug: string,
  data: EntityFrontmatter,
  content: string
): EntityFile {
  const filePath = resolveEntityPath(type, slug);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const file = matter.stringify(content, data);
  fs.writeFileSync(filePath, file, 'utf-8');

  return {
    id: data.id,
    type,
    slug,
    filePath,
    frontmatter: data,
    content,
  };
}

export function deleteEntity(type: EntityType, slug: string): boolean {
  const filePath = resolveEntityPath(type, slug);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

export function listEntities(type: EntityType): EntityFile[] {
  const dir = getEntityDir(type);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  return files
    .map((f) => {
      const slug = f.replace(/\.md$/, '');
      return readEntity(type, slug);
    })
    .filter((e): e is EntityFile => e !== null);
}

export function computeContentHash(content: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}
