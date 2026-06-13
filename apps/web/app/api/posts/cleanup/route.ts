import { NextRequest, NextResponse } from 'next/server';
import { db } from '@repo/db';
import * as schema from '@repo/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function cleanTitle(title: string): string {
  // Remove standalone "Review" word — don't touch "Reviewed", "Reviewing", "Preview", etc.
  return title.replace(/\bReview\b/gi, '').replace(/\s{2,}/g, ' ').trim();
}

function cleanContent(text: string): string {
  if (!text) return text;
  let cleaned = text;
  // Remove brand/identity references
  cleaned = cleaned.replace(/ASRWReviews/g, '');
  cleaned = cleaned.replace(/ASRW Reviews/g, '');
  cleaned = cleaned.replace(/slipperyslipped/gi, '');
  cleaned = cleaned.replace(/SlipperySlipped/g, '');
  // Clean up empty paragraph tags left behind
  cleaned = cleaned.replace(/<p>\s*<\/p>/g, '');
  // Clean up double spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  return cleaned;
}

export async function POST(req: NextRequest) {
  // Auth check
  const { requireAuth } = await import('@/lib/auth');
  const denied = requireAuth(req);
  if (denied) return denied;

  try {
    const allPosts = await db.select().from(schema.posts);
    
    let postsModified = 0;
    const changes: { id: string; slug: string; field: string; before: string; after: string }[] = [];

    for (const post of allPosts) {
      let modified = false;
      const updates: Partial<{ title: string; content: string; summary: string; updatedAt: Date }> = {};

      // Clean title
      const cleanedTitle = cleanTitle(post.title);
      if (cleanedTitle !== post.title) {
        changes.push({
          id: post.id,
          slug: post.slug,
          field: 'title',
          before: post.title,
          after: cleanedTitle,
        });
        updates.title = cleanedTitle;
        modified = true;
      }

      // Clean content
      const cleanedContent = cleanContent(post.content);
      if (cleanedContent !== post.content) {
        changes.push({
          id: post.id,
          slug: post.slug,
          field: 'content',
          before: `(${post.content.length} chars)`,
          after: `(${cleanedContent.length} chars)`,
        });
        updates.content = cleanedContent;
        modified = true;
      }

      // Clean summary
      const cleanedSummary = cleanContent(post.summary);
      if (cleanedSummary !== post.summary) {
        changes.push({
          id: post.id,
          slug: post.slug,
          field: 'summary',
          before: post.summary,
          after: cleanedSummary,
        });
        updates.summary = cleanedSummary;
        modified = true;
      }

      if (modified) {
        updates.updatedAt = new Date();
        await db.update(schema.posts).set(updates).where(eq(schema.posts.id, post.id));
        postsModified++;
      }
    }

    return NextResponse.json({
      postsScanned: allPosts.length,
      postsModified,
      changes,
    });
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed', detail: error?.message }, { status: 500 });
  }
}
