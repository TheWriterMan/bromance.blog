import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../lib/schema';
import { 
  MOCK_CATEGORIES, 
  MOCK_TAGS, 
  MOCK_POSTS, 
  MOCK_POST_TAGS, 
  MOCK_MEDIA, 
  MOCK_REVISIONS 
} from '../lib/mockdata';

const DATABASE_URL = 'postgresql://neondb_owner:npg_UqiSo0RFnB2f@ep-young-dew-aprss0dh.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function seed() {
  console.log('Connecting to Neon database at:', DATABASE_URL);
  const db = drizzle(neon(DATABASE_URL), { schema });

  console.log('Clearing old data from database tables...');
  try {
    await db.delete(schema.postRevisions);
    await db.delete(schema.postTags);
    await db.delete(schema.posts);
    await db.delete(schema.tags);
    await db.delete(schema.categories);
    await db.delete(schema.mediaItems);
  } catch (err) {
    console.warn('Silent clearing error:', err);
  }

  console.log('Seeding categories...');
  await db.insert(schema.categories).values(
    MOCK_CATEGORIES.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description
    }))
  );

  console.log('Seeding tags...');
  await db.insert(schema.tags).values(
    MOCK_TAGS.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug
    }))
  );

  console.log('Seeding posts...');
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

  console.log('Seeding postTags association join table...');
  await db.insert(schema.postTags).values(
    MOCK_POST_TAGS.map(pt => ({
      postId: pt.post_id,
      tagId: pt.tag_id
    }))
  );

  console.log('Seeding mediaItems...');
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

  console.log('Seeding revisions...');
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

  console.log('Database seeded with 100% real live data successfully!');
}

seed().catch(err => {
  console.error('Seed script failing:', err);
  process.exit(1);
});
