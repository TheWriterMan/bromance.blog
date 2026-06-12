import type { Metadata } from 'next';
import { getCollections, getCollectionBySlug, getSiteSettings } from '@/lib/blog-data';
import type { NovelChapter } from '@/lib/blog-data';
import MyWorkShowcase from '@/components/blog/my-work-showcase';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Novels — Work Library',
  description: 'Browse original web novel translations: ongoing and completed works.',
};

export default async function NovelsPage() {
  const [works, settings] = await Promise.all([
    getCollections('novels'),
    getSiteSettings(),
  ]);

  // Fetch chapters for each work in parallel
  const chaptersByWork: Record<string, NovelChapter[]> = {};
  if (works.length > 0) {
    const results = await Promise.all(works.map((w) => getCollectionBySlug(w.slug)));
    for (let i = 0; i < works.length; i++) {
      chaptersByWork[works[i].id] = results[i]?.chapters ?? [];
    }
  }

  return (
    <MyWorkShowcase
      works={works}
      chaptersByWork={chaptersByWork}
      kofiLink={settings.kofiLink || 'https://ko-fi.com/'}
    />
  );
}
