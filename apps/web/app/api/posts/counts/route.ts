import { NextResponse } from 'next/server';
import { db } from '@repo/db';
import * as schema from '@repo/db';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * Single endpoint that returns all status counts in one DB round-trip.
 * Replaces the old pattern of 4 parallel fetch('/api/posts?status=X&limit=1') calls.
 */
export async function GET() {
  try {
    const result = await db
      .select({
        status: schema.posts.status,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(schema.posts)
      .groupBy(schema.posts.status);

    const counts = { all: 0, published: 0, draft: 0, scheduled: 0 };
    for (const row of result) {
      const s = row.status as keyof typeof counts;
      if (s in counts) {
        counts[s] = row.count;
      }
      counts.all += row.count;
    }

    return NextResponse.json(counts);
  } catch (error) {
    console.error('Fetch post counts error:', error);
    return NextResponse.json({ all: 0, published: 0, draft: 0, scheduled: 0 }, { status: 500 });
  }
}
