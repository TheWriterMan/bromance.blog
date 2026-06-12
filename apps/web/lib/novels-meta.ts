/**
 * Hardcoded novel metadata (frontend-only, presentational).
 *
 * Per architecture rules, novels are just posts (type = 'novels'), grouped on
 * the frontend by their tag (the novel's name). The non-content metadata for a
 * novel — synopsis, author, cover, status, etc. — lives HERE in the frontend,
 * NOT in the database. To add/adjust a novel's presentation, edit this map.
 *
 * Keyed by the tag slug that identifies the novel. If a novel has no entry,
 * sensible defaults derived from the tag name are used.
 */

export interface NovelMeta {
  /** Display title (defaults to the tag name). */
  title?: string;
  altTitle?: string;
  synopsis?: string;
  author?: string;
  /** Cloudinary public_id or absolute URL for the cover. */
  coverImage?: string;
  status?: 'Ongoing' | 'Completed';
  genres?: string[];
}

export const NOVELS_META: Record<string, NovelMeta> = {
  // Example — replace the key with your novel's tag slug and fill in details:
  // 'the-untamed': {
  //   title: 'The Untamed',
  //   altTitle: '陈情令',
  //   synopsis: 'Two cultivators...',
  //   author: 'MXTX',
  //   coverImage: 'bromance-blog/medium-xxxxxxxx',
  //   status: 'Ongoing',
  //   genres: ['Xianxia', 'Romance', 'Drama'],
  // },
};

export function getNovelMeta(tagSlug: string, tagName: string): Required<Pick<NovelMeta, 'title' | 'status'>> & NovelMeta {
  const meta = NOVELS_META[tagSlug] ?? {};
  return {
    title: meta.title ?? tagName,
    status: meta.status ?? 'Ongoing',
    ...meta,
  };
}
