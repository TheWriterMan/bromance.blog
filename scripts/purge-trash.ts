/**
 * Purge Trash
 *
 * Permanently deletes posts and categories that have been in trash (deleted_at set)
 * for more than 30 days. Also cleans up related records (tags, revisions, likes, comments).
 *
 * Run via: pnpm tsx scripts/purge-trash.ts
 * Triggered by: GitHub Actions daily cron alongside publish-scheduled
 */

import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: 'require' });

async function main() {
  // Purge posts trashed 30+ days ago
  const trashedPosts = await sql`
    SELECT id, title FROM posts
    WHERE deleted_at IS NOT NULL
      AND deleted_at < NOW() - INTERVAL '30 days'
  `;

  if (trashedPosts.length > 0) {
    const postIds = trashedPosts.map(p => p.id);

    // Clean up related records
    await sql`DELETE FROM post_revisions WHERE post_id = ANY(${postIds})`;
    await sql`DELETE FROM post_tags WHERE post_id = ANY(${postIds})`;
    await sql`DELETE FROM post_likes WHERE post_id = ANY(${postIds})`;
    await sql`DELETE FROM comments WHERE post_id = ANY(${postIds})`;
    await sql`DELETE FROM posts WHERE id = ANY(${postIds})`;

    console.log(`Purged ${trashedPosts.length} post(s) from trash:`);
    for (const post of trashedPosts) {
      console.log(`  - [${post.id}] ${post.title}`);
    }
  } else {
    console.log('No posts to purge from trash.');
  }

  // Purge categories trashed 30+ days ago
  const trashedCategories = await sql`
    SELECT id, name FROM categories
    WHERE deleted_at IS NOT NULL
      AND deleted_at < NOW() - INTERVAL '30 days'
  `;

  if (trashedCategories.length > 0) {
    const catIds = trashedCategories.map(c => c.id);
    await sql`DELETE FROM categories WHERE id = ANY(${catIds})`;

    console.log(`Purged ${trashedCategories.length} category(ies) from trash:`);
    for (const cat of trashedCategories) {
      console.log(`  - [${cat.id}] ${cat.name}`);
    }
  } else {
    console.log('No categories to purge from trash.');
  }

  await sql.end();
}

main().catch((err) => {
  console.error('Failed to purge trash:', err);
  process.exit(1);
});
