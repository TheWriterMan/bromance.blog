import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_URL || '';

if (!databaseUrl) {
  console.warn("WARNING: DATABASE_URL is not set. Database connections will fail.");
}

// Connection pool sized for serverless concurrency.
// Supabase transaction pooler requires prepare: false.
// max: 10 allows parallel queries within a single serverless invocation
// without exhausting Supabase's default 60-connection limit across instances.
export const sql = postgres(databaseUrl || 'postgresql://postgres:postgres@localhost:5432/fake', {
  prepare: false,
  max: 10,
  ssl: 'require',
  idle_timeout: 20,
  connect_timeout: 15,
  max_lifetime: 60 * 5, // 5 min max connection lifetime to prevent stale pooler connections
});
export const db = drizzle(sql, { schema });

// Type interfaces used by components
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  status: 'draft' | 'published' | 'scheduled';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category_id: string;
  featured_image: string;
  meta_title: string;
  meta_description: string;
  canonical_url: string;
  views: number;
}

export interface PostTag {
  post_id: string;
  tag_id: string;
}

export interface MediaItem {
  id: string;
  cloudinary_id: string;
  filename: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  created_at: string;
}

export interface PostRevision {
  id: string;
  post_id: string;
  title: string;
  content: string;
  updated_by: string;
  created_at: string;
}


export interface Schema {
  categories: Category[];
  tags: Tag[];
  posts: Post[];
  post_tags: PostTag[];
  media: MediaItem[];
  revisions: PostRevision[];
}
