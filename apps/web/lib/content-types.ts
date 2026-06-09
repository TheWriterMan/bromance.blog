/**
 * Content Type Definitions
 *
 * Each content type maps to a `type` value on the posts table.
 * Standard fields (title, content, slug, etc.) are stored in regular columns.
 * Custom fields are stored in the JSONB `meta` column and validated here.
 *
 * To add a new content type: add an entry below. No database migration needed.
 */

export interface MetaFieldDef {
  type: "text" | "number" | "boolean" | "media" | "media_array" | "select";
  label: string;
  required?: boolean;
  options?: string[]; // for select type
  placeholder?: string;
}

export interface ContentTypeDef {
  name: string;
  icon: string; // Lucide icon name
  description: string;
  /** Standard post fields to show in the editor for this type */
  fields: string[];
  /** Custom fields stored in JSONB meta column */
  meta: Record<string, MetaFieldDef>;
}

export const contentTypes: Record<string, ContentTypeDef> = {
  article: {
    name: "Article",
    icon: "FileText",
    description: "Standard blog post with full editor",
    fields: ["title", "content", "summary", "featured_image", "category", "tags"],
    meta: {},
  },
  chapter: {
    name: "Chapter",
    icon: "BookOpen",
    description: "Novel chapter — grouped by series with ordering",
    fields: ["title", "content", "featured_image"],
    meta: {
      novel_title: { type: "text", label: "Novel Title", required: true, placeholder: "e.g. The Silent Garden" },
      chapter_number: { type: "number", label: "Chapter #", required: true },
      series_slug: { type: "text", label: "Series Slug", required: true, placeholder: "e.g. the-silent-garden" },
    },
  },
  gallery: {
    name: "Gallery",
    icon: "Images",
    description: "Image gallery with optional description",
    fields: ["title", "summary", "featured_image"],
    meta: {
      images: { type: "media_array", label: "Gallery Images" },
    },
  },
};

/** Get content type definition, falling back to article for unknown types */
export function getContentType(type: string): ContentTypeDef {
  return contentTypes[type] || contentTypes.article;
}

/** List all registered content type keys */
export function getContentTypeKeys(): string[] {
  return Object.keys(contentTypes);
}
