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
