import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { 
  MOCK_CATEGORIES, 
  MOCK_TAGS, 
  MOCK_POSTS, 
  MOCK_POST_TAGS, 
  MOCK_MEDIA, 
  MOCK_REVISIONS 
} from '@/lib/mockdata';

async function seedDatabase() {
  // Clear existing tables in correct order based on references
  console.log('Clearing old data...');
  try { await db.delete(schema.postRevisions); } catch (err) {}
  try { await db.delete(schema.postTags); } catch (err) {}
  try { await db.delete(schema.posts); } catch (err) {}
  try { await db.delete(schema.tags); } catch (err) {}
  try { await db.delete(schema.categories); } catch (err) {}
  try { await db.delete(schema.mediaItems); } catch (err) {}

  console.log('Inserting seed categories...');
  await db.insert(schema.categories).values(
    MOCK_CATEGORIES.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description
    }))
  );

  console.log('Inserting seed tags...');
  await db.insert(schema.tags).values(
    MOCK_TAGS.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug
    }))
  );

  console.log('Inserting seed posts...');
  await db.insert(schema.posts).values(
    MOCK_POSTS.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      content: p.content,
      summary: p.summary,
      status: p.status,
      publishedAt: p.published_at,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      categoryId: p.category_id,
      featuredImage: p.featured_image,
      metaTitle: p.meta_title,
      metaDescription: p.meta_description,
      canonicalUrl: p.canonical_url,
      views: p.views ?? 0
    }))
  );

  console.log('Inserting seed post_tags...');
  if (MOCK_POST_TAGS.length > 0) {
    await db.insert(schema.postTags).values(
      MOCK_POST_TAGS.map(pt => ({
        postId: pt.post_id,
        tagId: pt.tag_id
      }))
    );
  }

  console.log('Inserting seed media items...');
  await db.insert(schema.mediaItems).values(
    MOCK_MEDIA.map(m => ({
      id: m.id,
      cloudinaryId: m.cloudinary_id,
      filename: m.filename,
      width: m.width,
      height: m.height,
      format: m.format,
      bytes: m.bytes,
      createdAt: m.created_at
    }))
  );

  console.log('Inserting seed revisions...');
  if (MOCK_REVISIONS.length > 0) {
    await db.insert(schema.postRevisions).values(
      MOCK_REVISIONS.map(r => ({
        id: r.id,
        postId: r.post_id,
        title: r.title,
        content: r.content,
        updatedBy: r.updated_by,
        createdAt: r.created_at
      }))
    );
  }

  console.log('Database seeded successfully.');
}

export async function POST(req: NextRequest) {
  try {
    await seedDatabase();
    return NextResponse.json({ success: true, message: 'Database seeded successfully.' });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const categoriesList = await db.query.categories.findMany();
    const tagsList = await db.query.tags.findMany();
    const postsList = await db.query.posts.findMany();
    const mediaList = await db.query.mediaItems.findMany();
    const revisionsList = await db.query.postRevisions.findMany();

    return NextResponse.json({
      schema: {
        categories: categoriesList,
        tags: tagsList,
        posts: postsList,
        media: mediaList,
        revisions: revisionsList
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
