/**
 * CMS API Client
 *
 * Typed fetch wrappers for all CMS endpoints. Transforms backend snake_case
 * responses into the shapes the CMS frontend components expect.
 *
 * All CMS pages import from here — never call fetch() directly.
 */

const CLOUDINARY_CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dtperak4e';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PostStatus = 'published' | 'draft' | 'scheduled' | 'trash';
export type PostType = 'article' | 'tutorial' | 'review' | 'opinion' | string;

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  status: PostStatus;
  type: PostType;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  featuredImage: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  views: number;
  readTime: number;
  tags: Tag[];
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  noindex: boolean;
  ogImage: string | null;
  discussionOpen: boolean;
  meta: Record<string, unknown>;
}

export interface PostListResponse {
  items: Post[];
  metadata: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PostCounts {
  all: number;
  published: number;
  draft: number;
  scheduled: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  postCount: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface MediaItem {
  id: string;
  cloudinaryId: string;
  filename: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  createdAt: string;
  usedIn: number;
  url: string;
}

export interface Analytics {
  totalViews: number;
  totalPosts: number;
  publishedCount: number;
  draftsCount: number;
  scheduledCount: number;
  totalCategories: number;
  totalTags: number;
  avgReadTime: number;
  popularPosts: Array<{
    id: string;
    title: string;
    slug: string;
    views: number;
    status: string;
    publishedAt: string | null;
  }>;
  categoryDistribution: Array<{ id: string; name: string; count: number }>;
  tagDistribution: Array<{ id: string; name: string; count: number }>;
  viewsHistory: Array<{ date: string; views: number }>;
}

export interface Backup {
  id: string;
  cloudinaryId: string;
  filename: string;
  bytes: number;
  postCount: number;
  categoryCount: number;
  tagCount: number;
  mediaCount: number;
  createdAt: string;
}

export interface AuthorProfile {
  id: string;
  displayName: string;
  slug: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  // Extended fields from settings
  email: string;
  website: string;
  twitter: string;
  linkedin: string;
  location: string;
  pronouns: string;
}

export type SiteSettings = Record<string, string>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getCloudinaryUrl(
  publicId: string,
  options: { width?: number; height?: number; crop?: string; quality?: string } = {}
): string {
  if (!publicId) return '';
  const { width, height, crop = 'fill', quality = 'auto' } = options;
  const transforms: string[] = [`q_${quality}`, 'f_auto'];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (crop) transforms.push(`c_${crop}`);
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/${transforms.join(',')}/${publicId}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error || `API error: ${res.status}`);
  }
  return res.json();
}

// ─── Posts ───────────────────────────────────────────────────────────────────

function transformPost(raw: Record<string, any>): Post {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    content: raw.content || '',
    summary: raw.summary || '',
    status: raw.status,
    type: raw.type || 'article',
    categoryId: raw.category_id,
    categoryName: raw.category?.name ?? null,
    categorySlug: raw.category?.slug ?? null,
    featuredImage: raw.featured_image || '',
    publishedAt: raw.published_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    deletedAt: raw.deleted_at,
    views: raw.views ?? 0,
    readTime: raw.read_time ?? 1,
    tags: (raw.tags || []).map((t: any) => ({ id: t.id, name: t.name, slug: t.slug })),
    metaTitle: raw.meta_title || '',
    metaDescription: raw.meta_description || '',
    canonicalUrl: raw.canonical_url || '',
    noindex: raw.noindex ?? false,
    ogImage: raw.ogImage ?? null,
    discussionOpen: raw.discussion_open ?? true,
    meta: raw.meta || {},
  };
}

export interface FetchPostsParams {
  status?: string;
  categoryId?: string;
  search?: string;
  type?: string;
  tag?: string;
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
  excludeContent?: boolean;
}

export async function fetchPosts(params: FetchPostsParams = {}): Promise<PostListResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.categoryId) query.set('category_id', params.categoryId);
  if (params.search) query.set('search', params.search);
  if (params.type) query.set('type', params.type);
  if (params.tag) query.set('tag', params.tag);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.includeDeleted) query.set('includeDeleted', 'true');
  if (params.excludeContent) query.set('excludeContent', 'true');

  const raw = await apiFetch<any>(`/api/posts?${query.toString()}`);
  return {
    items: (raw.items || []).map(transformPost),
    metadata: raw.metadata,
  };
}

export async function fetchPost(id: string): Promise<Post> {
  const raw = await apiFetch<any>(`/api/posts/${id}`);
  return transformPost(raw);
}

export async function createPost(data: Record<string, any>): Promise<Post> {
  const raw = await apiFetch<any>('/api/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return transformPost(raw);
}

export async function updatePost(id: string, data: Record<string, any>): Promise<Post> {
  const raw = await apiFetch<any>(`/api/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return transformPost(raw);
}

export async function deletePost(id: string, permanent = false): Promise<void> {
  const query = permanent ? '?permanent=true' : '';
  await apiFetch(`/api/posts/${id}${query}`, { method: 'DELETE' });
}

export async function fetchPostCounts(): Promise<PostCounts> {
  return apiFetch<PostCounts>('/api/posts/counts');
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function fetchCategories(includeDeleted = false): Promise<Category[]> {
  const query = includeDeleted ? '?includeDeleted=true' : '';
  const raw = await apiFetch<any[]>(`/api/categories${query}`);
  return raw.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || '',
    parentId: c.parent_id,
    postCount: c.post_count ?? 0,
  }));
}

export async function createCategory(data: { name: string; slug: string; description?: string; parent_id?: string | null }): Promise<Category> {
  const raw = await apiFetch<any>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description || '',
    parentId: raw.parent_id,
    postCount: 0,
  };
}

export async function updateCategory(id: string, data: Record<string, any>): Promise<Category> {
  const raw = await apiFetch<any>(`/api/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description || '',
    parentId: raw.parent_id,
    postCount: raw.post_count ?? 0,
  };
}

export async function deleteCategory(id: string, permanent = false): Promise<void> {
  const query = permanent ? '?permanent=true' : '';
  await apiFetch(`/api/categories/${id}${query}`, { method: 'DELETE' });
}

// ─── Tags ────────────────────────────────────────────────────────────────────

export async function fetchTags(): Promise<Tag[]> {
  return apiFetch<Tag[]>('/api/tags');
}

export async function createTag(data: { name: string; slug: string }): Promise<Tag> {
  return apiFetch<Tag>('/api/tags', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Media ───────────────────────────────────────────────────────────────────

export async function fetchMedia(): Promise<MediaItem[]> {
  const raw = await apiFetch<any[]>('/api/media');
  return raw.map(m => ({
    id: m.id,
    cloudinaryId: m.cloudinary_id,
    filename: m.filename,
    width: m.width,
    height: m.height,
    format: m.format,
    bytes: m.bytes,
    createdAt: m.created_at,
    usedIn: m.used_in ?? 0,
    url: getCloudinaryUrl(m.cloudinary_id, { width: 800, quality: 'auto' }),
  }));
}

export async function uploadMedia(file: File): Promise<MediaItem> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error || 'Upload failed');
  }
  const m = await res.json();
  return {
    id: m.id,
    cloudinaryId: m.cloudinary_id,
    filename: m.filename,
    width: m.width,
    height: m.height,
    format: m.format,
    bytes: m.bytes,
    createdAt: m.created_at,
    usedIn: 0,
    url: getCloudinaryUrl(m.cloudinary_id, { width: 800, quality: 'auto' }),
  };
}

export async function deleteMedia(id: string): Promise<void> {
  await apiFetch(`/api/media/${id}`, { method: 'DELETE' });
}

export async function bulkDeleteMedia(ids: string[]): Promise<void> {
  await apiFetch('/api/media/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export async function fetchAnalytics(): Promise<Analytics> {
  const raw = await apiFetch<any>('/api/analytics');
  return {
    totalViews: raw.totalViews,
    totalPosts: raw.totalPosts,
    publishedCount: raw.publishedCount,
    draftsCount: raw.draftsCount,
    scheduledCount: raw.scheduledCount,
    totalCategories: raw.totalCategories ?? 0,
    totalTags: raw.totalTags ?? 0,
    avgReadTime: raw.avgReadTime ?? 0,
    popularPosts: (raw.popularPosts || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      views: p.views,
      status: p.status,
      publishedAt: p.published_at,
    })),
    categoryDistribution: raw.categoryDistribution || [],
    tagDistribution: raw.tagDistribution || [],
    viewsHistory: raw.viewsHistory || [],
  };
}

// ─── Backups ─────────────────────────────────────────────────────────────────

export async function fetchBackups(): Promise<Backup[]> {
  const raw = await apiFetch<any[]>('/api/backups');
  return raw.map(b => ({
    id: b.id,
    cloudinaryId: b.cloudinary_id,
    filename: b.filename,
    bytes: b.bytes,
    postCount: b.post_count,
    categoryCount: b.category_count,
    tagCount: b.tag_count,
    mediaCount: b.media_count,
    createdAt: b.created_at,
  }));
}

export async function createBackup(): Promise<Backup> {
  const b = await apiFetch<any>('/api/backups', { method: 'POST' });
  return {
    id: b.id,
    cloudinaryId: b.cloudinary_id,
    filename: b.filename,
    bytes: b.bytes,
    postCount: b.post_count,
    categoryCount: b.category_count,
    tagCount: b.tag_count,
    mediaCount: b.media_count,
    createdAt: b.created_at,
  };
}

export async function restoreBackup(backupId: string): Promise<{ success: boolean; message: string }> {
  return apiFetch('/api/backups/restore', {
    method: 'POST',
    body: JSON.stringify({ backup_id: backupId }),
  });
}

// ─── Author ──────────────────────────────────────────────────────────────────

export async function fetchAuthor(): Promise<AuthorProfile> {
  const [authorRaw, settings] = await Promise.all([
    apiFetch<any>('/api/authors'),
    apiFetch<Record<string, string>>('/api/settings'),
  ]);

  return {
    id: authorRaw.id,
    displayName: authorRaw.display_name,
    slug: authorRaw.slug,
    bio: authorRaw.bio,
    avatarUrl: authorRaw.avatar_url,
    createdAt: authorRaw.created_at,
    updatedAt: authorRaw.updated_at,
    email: settings.author_email || '',
    website: settings.author_website || '',
    twitter: settings.author_twitter || '',
    linkedin: settings.author_linkedin || '',
    location: settings.author_location || '',
    pronouns: settings.author_pronouns || '',
  };
}

export async function updateAuthor(data: Partial<AuthorProfile>): Promise<void> {
  // Update core author fields
  await apiFetch('/api/authors', {
    method: 'PUT',
    body: JSON.stringify({
      display_name: data.displayName,
      slug: data.slug,
      bio: data.bio,
      avatar_url: data.avatarUrl,
    }),
  });

  // Update extended fields via settings
  const settingsUpdate: Record<string, string> = {};
  if (data.email !== undefined) settingsUpdate.author_email = data.email;
  if (data.website !== undefined) settingsUpdate.author_website = data.website;
  if (data.twitter !== undefined) settingsUpdate.author_twitter = data.twitter;
  if (data.linkedin !== undefined) settingsUpdate.author_linkedin = data.linkedin;
  if (data.location !== undefined) settingsUpdate.author_location = data.location;
  if (data.pronouns !== undefined) settingsUpdate.author_pronouns = data.pronouns;

  if (Object.keys(settingsUpdate).length > 0) {
    await apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsUpdate),
    });
  }
}

export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/authors/avatar', { method: 'POST', body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error || 'Avatar upload failed');
  }
  const data = await res.json();
  return data.avatar_url;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function fetchSettings(): Promise<SiteSettings> {
  return apiFetch<SiteSettings>('/api/settings');
}

export async function updateSettings(data: SiteSettings): Promise<SiteSettings> {
  return apiFetch<SiteSettings>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
