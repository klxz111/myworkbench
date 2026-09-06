import { NextRequest, NextResponse } from 'next/server';
import { readEntity, writeEntity, EntityType } from '@/lib/markdown';
import { syncMarkdownToSqlite } from '@/lib/sync';
import {
  PROFILE_VERSIONS,
  ProfileVersionKey,
  compileProfileVersion,
  compileAllProfileVersions,
} from '@/lib/profile-compiler';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const version = request.nextUrl.searchParams.get('version') as ProfileVersionKey | null;

    if (version) {
      if (!PROFILE_VERSIONS.some((v) => v.key === version)) {
        return NextResponse.json({ error: `Unknown version: ${version}` }, { status: 400 });
      }
      return NextResponse.json(compileProfileVersion(version));
    }

    return NextResponse.json({
      versions: PROFILE_VERSIONS,
      compiled: compileAllProfileVersions(),
    });
  } catch (error) {
    console.error('Error compiling profile:', error);
    return NextResponse.json({ error: 'Failed to compile profile' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const profileId: string | undefined = body.profile_id;
    if (!profileId) {
      return NextResponse.json({ error: 'Missing profile_id' }, { status: 400 });
    }

    const profile = readEntity('profile' as EntityType, profileId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const compiled = compileAllProfileVersions();

    // 写回档案 frontmatter：每个版本 {title, summary, highlights, target_audience}
    const versions: Record<string, unknown> = {};
    for (const spec of PROFILE_VERSIONS) {
      const v = compiled[spec.key];
      versions[spec.key] = {
        title: v.title,
        summary: v.summary,
        highlights: v.highlights.map((h) => h.text),
        target_audience: v.target_audience,
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    const frontmatter = {
      ...profile.frontmatter,
      versions,
      compiled_from: Array.from(new Set(Object.values(compiled).flatMap((v) => v.compiled_from))),
      last_compiled: today,
      updated_at: new Date().toISOString(),
    };
    writeEntity('profile' as EntityType, profileId, frontmatter, profile.content);
    syncMarkdownToSqlite();

    return NextResponse.json({
      success: true,
      compiled,
      versions,
      last_compiled: today,
    });
  } catch (error) {
    console.error('Error compiling and writing back profile:', error);
    return NextResponse.json({ error: 'Failed to compile profile' }, { status: 500 });
  }
}
