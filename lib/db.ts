import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import { getSeedSchema } from './mockdata';

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_URL || '';

// Always initialize it so that type inferences don't break, but error clearly if not set
if (!databaseUrl) {
  console.warn("WARNING: DATABASE_URL is not set. Database connections will fail.");
}

// For Supabase we use { prepare: false } for connection pooler compatibility
export const sql = postgres(databaseUrl || 'postgresql://postgres:postgres@localhost:5432/fake', { prepare: false, max: 1 });
export const db = drizzle(sql, { schema });

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
  content: string; // HTML or structured content
  summary: string; // Excerpt/SEO
  status: 'draft' | 'published' | 'scheduled';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category_id: string;
  featured_image: string; // Cloudinary Public ID
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
  cloudinary_id: string; // Cloudinary Public ID
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

const DB_FILE = path.join(process.cwd(), 'db.json');

// Helper to load schema from JSON file (as a robust fallback)
export function readDB(): Schema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialSchema = getSeedSchema();
      saveDB(initialSchema);
      return initialSchema;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data) as Schema;
  } catch (error) {
    console.error('Error reading DB, using hardcoded static structure', error);
    return getSeedSchema();
  }
}

// Helper to save schema to JSON file (as a robust fallback)
export function saveDB(data: Schema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to DB file', error);
  }
}
