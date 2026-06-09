/**
 * Publish Scheduled Posts
 *
 * Finds all posts with status='scheduled' and published_at <= NOW(),
 * then flips their status to 'published'.
 *
 * Run via: pnpm tsx scripts/publish-scheduled.ts
 * Triggered by: GitHub Actions daily cron or manual workflow_dispatch
 */

import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: 'require' });

async function main() {
  const result = await sql`
    UPDATE posts
    SET status = 'published', updated_at = NOW()
    WHERE status = 'scheduled'
      AND published_at <= NOW()
      AND deleted_at IS NULL
    RETURNING id, title, slug
  `;

  if (result.length === 0) {
    console.log('No scheduled posts ready to publish.');
  } else {
    console.log(`Published ${result.length} post(s):`);
    for (const post of result) {
      console.log(`  - [${post.id}] ${post.title} (/${post.slug})`);
    }
  }

  await sql.end();
}

main().catch((err) => {
  console.error('Failed to publish scheduled posts:', err);
  process.exit(1);
});
