import { pgTable, text, varchar, integer, primaryKey } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description").notNull(),
});

export const tags = pgTable("tags", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
});

export const posts = pgTable("posts", {
  id: varchar("id", { length: 50 }).primaryKey(),
  title: text("title").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  summary: text("summary").notNull(),
  status: text("status").notNull(), // 'draft' | 'published' | 'scheduled'
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  categoryId: varchar("category_id", { length: 50 }).references(() => categories.id, { onDelete: 'cascade' }),
  featuredImage: text("featured_image").notNull(),
  metaTitle: text("meta_title").notNull(),
  metaDescription: text("meta_description").notNull(),
  canonicalUrl: text("canonical_url").notNull(),
  views: integer("views").default(0).notNull(),
  noindex: integer("noindex").default(0).notNull(),
  ogImage: text("og_image"),
});

export const postTags = pgTable("post_tags", {
  postId: varchar("post_id", { length: 50 }).references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  tagId: varchar("tag_id", { length: 50 }).references(() => tags.id, { onDelete: 'cascade' }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.postId, table.tagId] })
]);

export const mediaItems = pgTable("media_items", {
  id: varchar("id", { length: 50 }).primaryKey(),
  cloudinaryId: text("cloudinary_id").notNull(),
  filename: text("filename").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  format: text("format").notNull(),
  bytes: integer("bytes").notNull(),
  createdAt: text("created_at").notNull(),
});

export const postRevisions = pgTable("post_revisions", {
  id: varchar("id", { length: 50 }).primaryKey(),
  postId: varchar("post_id", { length: 50 }).references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  updatedBy: text("updated_by").notNull(),
  createdAt: text("created_at").notNull(),
});

export const redirects = pgTable("redirects", {
  id: varchar("id", { length: 50 }).primaryKey(),
  source: varchar("source", { length: 255 }).notNull().unique(),
  destination: varchar("destination", { length: 255 }).notNull(),
  permanent: integer("permanent").default(1).notNull(), // 1 for 301, 0 for 302
  createdAt: text("created_at").notNull(),
});
