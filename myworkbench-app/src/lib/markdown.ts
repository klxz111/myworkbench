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
  | 'belief'
  | 'opportunity'
  | 'radar'
  | 'capital'
  | 'profile'
  | 'event'
  | 'organization'
  | 'task';

export const ENTITY_DIRS: Record<EntityType, string> = {
  strategy: 'strategy',
  research: 'research',
  decision: 'decisions',
  project: 'projects',
  experiment: 'experiments',
  person: 'people',
  evidence: 'evidence',
  belief: 'beliefs',
  opportunity: 'opportunities',
  radar: 'radar',
  capital: 'capital',
  profile: 'profile',
  event: 'events',
  organization: 'organizations',
  task: 'tasks',
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
    return path.join(/* turbopackIgnore: true */ cwd, '..', 'entities');
  }
  return path.join(/* turbopackIgnore: true */ cwd, 'entities');
}

export function getEntityDir(type: EntityType): string {
  return path.join(/* turbopackIgnore: true */ getEntityRoot(), ENTITY_DIRS[type]);
}

export function resolveEntityPath(type: EntityType, slug: string): string {
  return path.join(getEntityDir(type), `${slug}.md`);
}

export function readEntity(type: EntityType, slug: string): EntityFile | null {
  const filePath = resolveEntityPath(type, slug);
  if (!fs.existsSync(/* turbopackIgnore: true */ filePath)) return null;

  const raw = fs.readFileSync(/* turbopackIgnore: true */ filePath, 'utf-8');
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
  if (!fs.existsSync(/* turbopackIgnore: true */ dir)) {
    fs.mkdirSync(/* turbopackIgnore: true */ dir, { recursive: true });
  }

  // content 属于正文，不应写进 frontmatter
  const { content: _ignored, ...frontmatterOnly } = data as Record<string, unknown>;
  const file = matter.stringify(content, frontmatterOnly);
  fs.writeFileSync(/* turbopackIgnore: true */ filePath, file, 'utf-8');

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
  if (!fs.existsSync(/* turbopackIgnore: true */ filePath)) return false;
  fs.unlinkSync(/* turbopackIgnore: true */ filePath);
  return true;
}

/* ---------------- 回收站（软删除） ---------------- */

export function getTrashDir(): string {
  return path.join(getEntityRoot(), '.trash');
}

export interface TrashItem {
  file: string;
  type: EntityType;
  slug: string;
  title: string;
  deleted_at: string;
}

/** 删除实体：移入 entities/.trash/，可恢复 */
export function moveEntityToTrash(type: EntityType, slug: string): string | null {
  const filePath = resolveEntityPath(type, slug);
  if (!fs.existsSync(/* turbopackIgnore: true */ filePath)) return null;

  const trashDir = getTrashDir();
  if (!fs.existsSync(/* turbopackIgnore: true */ trashDir)) {
    fs.mkdirSync(/* turbopackIgnore: true */ trashDir, { recursive: true });
  }

  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const ts = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  const trashName = `${ts}-${type}-${slug}.md`;

  fs.renameSync(/* turbopackIgnore: true */ filePath, path.join(trashDir, trashName));
  return trashName;
}

export function listTrash(): TrashItem[] {
  const trashDir = getTrashDir();
  if (!fs.existsSync(/* turbopackIgnore: true */ trashDir)) return [];

  return fs
    .readdirSync(/* turbopackIgnore: true */ trashDir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      try {
        const raw = fs.readFileSync(/* turbopackIgnore: true */ path.join(trashDir, file), 'utf-8');
        const parsed = matter(raw);
        const data = parsed.data as EntityFrontmatter;
        // 文件名前缀即删除时间
        const m = file.match(/^(\d{8}-\d{6})-/);
        return {
          file,
          type: data.type,
          slug: data.id || file.replace(/^\d{8}-\d{6}-[a-z]+-/, '').replace(/\.md$/, ''),
          title: data.title || file,
          deleted_at: m ? m[1] : file,
        };
      } catch {
        return null;
      }
    })
    .filter((x): x is TrashItem => x !== null)
    .sort((a, b) => b.deleted_at.localeCompare(a.deleted_at));
}

/** 从回收站恢复；目标 slug 已存在时返回冲突 */
export function restoreFromTrash(file: string): { ok: boolean; error?: string; type?: EntityType; slug?: string } {
  if (!/^[\w.-]+\.md$/.test(file)) return { ok: false, error: '非法文件名' };
  const trashPath = path.join(getTrashDir(), file);
  if (!fs.existsSync(/* turbopackIgnore: true */ trashPath)) return { ok: false, error: '回收站中不存在该文件' };

  const raw = fs.readFileSync(/* turbopackIgnore: true */ trashPath, 'utf-8');
  const parsed = matter(raw);
  const data = parsed.data as EntityFrontmatter;
  if (!data.type || !ENTITY_DIRS[data.type as EntityType]) {
    return { ok: false, error: '文件缺少有效的实体类型' };
  }
  const type = data.type as EntityType;
  const slug = file.replace(/^\d{8}-\d{6}-[a-z]+-/, '').replace(/\.md$/, '');

  const targetPath = resolveEntityPath(type, slug);
  if (fs.existsSync(/* turbopackIgnore: true */ targetPath)) {
    return { ok: false, error: `${type}/${slug} 已存在，无法恢复` };
  }

  fs.renameSync(/* turbopackIgnore: true */ trashPath, targetPath);
  return { ok: true, type, slug };
}

export function purgeTrashFile(file: string): boolean {
  if (!/^[\w.-]+\.md$/.test(file)) return false;
  const trashPath = path.join(getTrashDir(), file);
  if (!fs.existsSync(/* turbopackIgnore: true */ trashPath)) return false;
  fs.unlinkSync(/* turbopackIgnore: true */ trashPath);
  return true;
}

export function listEntities(type: EntityType): EntityFile[] {
  const dir = getEntityDir(type);
  if (!fs.existsSync(/* turbopackIgnore: true */ dir)) return [];

  const files = fs.readdirSync(/* turbopackIgnore: true */ dir).filter((f) => f.endsWith('.md'));
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
