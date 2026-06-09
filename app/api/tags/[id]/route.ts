import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAuth(req);
  if (denied) return denied;

  try {
    const { id } = await params;

    const existing = await db
      .select()
      .from(schema.tags)
      .where(eq(schema.tags.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    await db.delete(schema.tags).where(eq(schema.tags.id, id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Tag delete error:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
