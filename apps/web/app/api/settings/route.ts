import { NextRequest, NextResponse } from 'next/server';
import { db } from '@repo/db';
import * as schema from '@repo/db';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settings — returns all settings as a flat { key: value } object.
 */
export async function GET() {
  try {
    const rows = await db.select().from(schema.settings);
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

/**
 * PUT /api/settings — upserts key-value pairs.
 * Body: { [key: string]: string }
 */
export async function PUT(req: NextRequest) {
  const denied = requireAuth(req);
  if (denied) return denied;

  try {
    const data = await req.json();

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return NextResponse.json({ error: 'Body must be a key-value object' }, { status: 400 });
    }

    const now = new Date();
    const entries = Object.entries(data).filter(
      ([key, value]) => typeof key === 'string' && typeof value === 'string'
    );

    if (entries.length === 0) {
      return NextResponse.json({ error: 'No valid key-value pairs provided' }, { status: 400 });
    }

    for (const [key, value] of entries) {
      await db
        .insert(schema.settings)
        .values({ key, value: value as string, updatedAt: now })
        .onConflictDoUpdate({
          target: schema.settings.key,
          set: { value: value as string, updatedAt: now },
        });
    }

    // Return updated state
    const rows = await db.select().from(schema.settings);
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT /api/settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
