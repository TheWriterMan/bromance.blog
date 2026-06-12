-- Manual additive migration — Generic Content-Type System + Novels + Reviews
-- Plan: docs/plans/plan-content-types-novels.md (Steps 1–12)
--
-- SAFETY: This migration is ADDITIVE and NON-DESTRUCTIVE. It creates new tables,
-- one new nullable column, and indexes only. It NEVER drops, renames, deletes,
-- or overwrites any existing column or row. The 7 existing posts are untouched
-- (they already have type='article' via the column default).
--
-- HOW TO APPLY: This does NOT run automatically. Paste it into the Supabase SQL
-- editor (or run via psql against DATABASE_URL) ONCE, in order. It is idempotent
-- (safe to re-run) thanks to IF NOT EXISTS / ON CONFLICT guards.
--
-- DO NOT run `drizzle-kit push` / `drizzle-kit migrate` against production — that
-- can attempt destructive diffs. Apply this hand-written SQL only.

-- 1. New column on posts (nullable; existing rows get NULL)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS collection_id varchar(50);
CREATE INDEX IF NOT EXISTS idx_posts_collection_id ON posts (collection_id);

-- 2. content_types
CREATE TABLE IF NOT EXISTS content_types (
  id varchar(50) PRIMARY KEY,
  name text NOT NULL,
  key varchar(50) NOT NULL UNIQUE,
  url_prefix varchar(50) NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  icon varchar(50),
  has_collections boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. collections (novel-works; generic to any type)
CREATE TABLE IF NOT EXISTS collections (
  id varchar(50) PRIMARY KEY,
  type_key varchar(50) NOT NULL,
  name text NOT NULL,
  slug varchar(150) NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  cover_image text NOT NULL DEFAULT '',
  status varchar(30) NOT NULL DEFAULT 'ongoing',
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_collections_type_key ON collections (type_key);

-- 4. reviews (keyed to collections)
CREATE TABLE IF NOT EXISTS reviews (
  id varchar(50) PRIMARY KEY,
  collection_id varchar(50) NOT NULL,
  author_name text,
  rating integer NOT NULL DEFAULT 5,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_collection_id ON reviews (collection_id);

-- 5. Seed the two launch content types (idempotent).
--    The 7 existing posts already have type='article' (column default) — no UPDATE needed.
INSERT INTO content_types (id, name, key, url_prefix, description, icon, has_collections, sort_order)
VALUES
  ('ct_articles', 'Articles', 'article', 'articles', 'Reviews, recaps, and editorial posts', 'FileText', false, 0),
  ('ct_novels',   'Novels',   'novels',  'novels',   'Original web novel translations',        'BookOpen', true,  1)
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK (only if fully reverting — drops ONLY new objects, never existing data):
--
--   DROP TABLE IF EXISTS reviews;
--   DROP TABLE IF EXISTS collections;
--   DROP TABLE IF EXISTS content_types;
--   ALTER TABLE posts DROP COLUMN IF EXISTS collection_id;
-- ─────────────────────────────────────────────────────────────────────────────
