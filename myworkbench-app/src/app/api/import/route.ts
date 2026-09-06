import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getEntityRoot, ENTITY_DIRS, EntityType, EntityFrontmatter } from '@/lib/markdown';
import { syncMarkdownToSqlite } from '@/lib/sync';

export const runtime = 'nodejs';

interface SnapshotEntity {
  dir: string;
  file: string;
  raw: string;
}

const DIR_TO_TYPE: Record<string, EntityType> = Object.entries(ENTITY_DIRS).reduce(
  (acc, [type, dir]) => {
    acc[dir] = type as EntityType;
    return acc;
  },
  {} as Record<string, EntityType>
);

/** 导入 JSON 快照（由 /api/export?format=json 生成）；mode: merge 跳过已存在 | replace 覆盖 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const snapshot = body?.snapshot;
    const mode: 'merge' | 'replace' = body?.mode === 'replace' ? 'replace' : 'merge';

    if (!snapshot || !Array.isArray(snapshot.entities)) {
      return NextResponse.json({ error: '无效的快照格式' }, { status: 400 });
    }

    const root = getEntityRoot();
    let created = 0;
    let overwritten = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const entity of snapshot.entities as SnapshotEntity[]) {
      try {
        if (!entity.dir || !entity.file || typeof entity.raw !== 'string') {
          skipped++;
          continue;
        }
        const type = DIR_TO_TYPE[entity.dir];
        if (!type) {
          errors.push(`未知目录：${entity.dir}`);
          skipped++;
          continue;
        }
        const slug = entity.file.replace(/\.md$/, '');
        const parsed = matter(entity.raw);
        const fm = parsed.data as EntityFrontmatter;
        const entityId = fm.id || slug;

        const targetDir = path.join(root, entity.dir);
        const targetPath = path.join(targetDir, entity.file);
        const exists = fs.existsSync(/* turbopackIgnore: true */ targetPath);

        if (exists && mode === 'merge') {
          skipped++;
          continue;
        }

        if (!fs.existsSync(/* turbopackIgnore: true */ targetDir)) {
          fs.mkdirSync(/* turbopackIgnore: true */ targetDir, { recursive: true });
        }
        fs.writeFileSync(/* turbopackIgnore: true */ targetPath, entity.raw, 'utf-8');

        if (exists) overwritten++;
        else created++;

        // 保持 id 与 slug 一致（文件是从本系统导出的，一般已一致）
        if (fm.id !== entityId) {
          const fixed = matter.stringify(parsed.content, { ...fm, id: entityId });
          fs.writeFileSync(/* turbopackIgnore: true */ targetPath, fixed, 'utf-8');
        }
      } catch (e) {
        errors.push(`${entity.file}: ${e instanceof Error ? e.message : '写入失败'}`);
        skipped++;
      }
    }

    syncMarkdownToSqlite();

    return NextResponse.json({
      success: true,
      mode,
      total: snapshot.entities.length,
      created,
      overwritten,
      skipped,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error('Error importing snapshot:', error);
    return NextResponse.json({ error: 'Failed to import snapshot' }, { status: 500 });
  }
}
