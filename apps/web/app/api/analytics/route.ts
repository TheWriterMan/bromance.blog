import { NextResponse } from 'next/server';
import { db } from '@repo/db';
import * as schema from '@repo/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const posts = await db.select().from(schema.posts);
    const categories = await db.select().from(schema.categories);
    const tags = await db.select().from(schema.tags);
    const postTags = await db.select().from(schema.postTags);

    // Totals
    const totalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0);
    const totalPosts = posts.length;
    const publishedCount = posts.filter(p => p.status === 'published').length;
    const draftsCount = posts.filter(p => p.status === 'draft').length;
    const scheduledCount = posts.filter(p => p.status === 'scheduled').length;

    // Popular posts sorted by views
    const popularPosts = [...posts]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        views: p.views,
        status: p.status,
        published_at: p.publishedAt
      }));

    // Posts by category count
    const categoryDistribution = categories.map(cat => {
      const count = posts.filter(p => p.categoryId === cat.id).length;
      return {
        id: cat.id,
        name: cat.name,
        count
      };
    });

    // Tag counts
    const tagDistribution = tags.map(t => {
      const count = postTags.filter(pt => pt.tagId === t.id).length;
      return {
        id: t.id,
        name: t.name,
        count
      };
    }).sort((a, b) => b.count - a.count).slice(0, 6);

    // Simulated views history (e.g. over last 7 days)
    const viewsHistory = [
      { date: 'Jun 1', views: Math.floor(totalViews * 0.10) },
      { date: 'Jun 2', views: Math.floor(totalViews * 0.12) },
      { date: 'Jun 3', views: Math.floor(totalViews * 0.15) },
      { date: 'Jun 4', views: Math.floor(totalViews * 0.14) },
      { date: 'Jun 5', views: Math.floor(totalViews * 0.18) },
      { date: 'Jun 6', views: Math.floor(totalViews * 0.16) },
      { date: 'Jun 7', views: Math.floor(totalViews * 0.15) }
    ];

    return NextResponse.json({
      totalViews,
      totalPosts,
      publishedCount,
      draftsCount,
      scheduledCount,
      popularPosts,
      categoryDistribution,
      tagDistribution,
      viewsHistory
    });
  } catch (error) {
    console.error('Analytics compute error:', error);
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 });
  }
}
