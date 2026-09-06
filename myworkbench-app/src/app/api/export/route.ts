import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getEntityRoot, ENTITY_DIRS } from '@/lib/markdown';
import { initDb } from '@/lib/db';
import { getWorkspaceRoot } from '@/lib/workspace-path';
import type JSZip from 'jszip';

export const runtime = 'nodejs';

/** 递归把目录内容写入 zip 子目录（附件等二进制资产随备份走） */
function addDirToZip(zipDir: JSZip, absDir: string): void {
  for (const entry of fs.readdirSync(/* turbopackIgnore: true */ absDir, { withFileTypes: true })) {
    const abs = path.join(absDir, entry.name);
    if (entry.isDirectory()) {
      const sub = zipDir.folder(entry.name);
      if (sub) addDirToZip(sub, abs);
    } else if (entry.isFile()) {
      zipDir.file(entry.name, fs.readFileSync(abs));
    }
  }
}

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function collectEntityFiles(): { dir: string; file: string; fullPath: string }[] {
  const root = getEntityRoot();
  const out: { dir: string; file: string; fullPath: string }[] = [];
  if (!fs.existsSync(/* turbopackIgnore: true */ root)) return out;
  for (const dir of Object.values(ENTITY_DIRS)) {
    const dirPath = path.join(root, dir);
    if (!fs.existsSync(/* turbopackIgnore: true */ dirPath)) continue;
    for (const file of fs.readdirSync(/* turbopackIgnore: true */ dirPath)) {
      if (!file.endsWith('.md')) continue;
      out.push({ dir, file, fullPath: path.join(dirPath, file) });
    }
  }
  return out;
}

export async function GET(request: NextRequest) {
  try {
    const format = request.nextUrl.searchParams.get('format') || 'zip';
    const files = collectEntityFiles();
    const counts: Record<string, number> = {};
    for (const f of files) {
      counts[f.dir] = (counts[f.dir] || 0) + 1;
    }
    const manifest = {
      app: 'myworkbench',
      generated_at: new Date().toISOString(),
      entity_count: files.length,
      counts,
    };

    if (format === 'json') {
      const db = initDb();
      const relations = db
        .prepare('SELECT from_id, to_id, relation FROM relations')
        .all() as { from_id: string; to_id: string; relation: string }[];

      const entities = files.map((f) => {
        const raw = fs.readFileSync(/* turbopackIgnore: true */ f.fullPath, 'utf-8');
        return { dir: f.dir, file: f.file, raw };
      });

      const snapshot = {
        ...manifest,
        relations,
        entities,
      };

      return new NextResponse(JSON.stringify(snapshot, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="myworkbench-snapshot-${timestamp()}.json"`,
        },
      });
    }

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const entityRoot = zip.folder('entities');
    for (const f of files) {
      const raw = fs.readFileSync(/* turbopackIgnore: true */ f.fullPath);
      entityRoot?.folder(f.dir)?.file(f.file, raw);
    }
    const attachmentsDir = path.join(getWorkspaceRoot(), 'attachments');
    if (fs.existsSync(/* turbopackIgnore: true */ attachmentsDir)) {
      const attachmentRoot = zip.folder('attachments');
      if (attachmentRoot) addDirToZip(attachmentRoot, attachmentsDir);
    }
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    const buffer = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });

    return new NextResponse(new Blob([buffer]), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="myworkbench-backup-${timestamp()}.zip"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
