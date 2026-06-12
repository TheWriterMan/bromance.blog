import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Coffee, ChevronLeft, ChevronRight } from 'lucide-react';
import { getNovelBySlug, getNovelChapters, getSiteSettings } from '@/lib/blog-data';
import { getNovelMeta } from '@/lib/novels-meta';
import { renderPostContent } from '@/lib/tiptap-html';
import { formatDate } from '@/lib/utils';
import ViewCounter from '@/components/blog/view-counter';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const chapter = await getNovelBySlug(slug);
  if (!chapter) return { title: 'Chapter not found' };
  return {
    title: chapter.metaTitle || chapter.title,
    description: chapter.metaDescription || chapter.summary,
    robots: chapter.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function NovelChapterPage({ params }: PageProps) {
  const { slug } = await params;

  const [chapter, allChapters, settings] = await Promise.all([
    getNovelBySlug(slug),
    getNovelChapters(),
    getSiteSettings(),
  ]);

  if (!chapter) notFound();

  // Determine the novel (first tag) and compute prev/next within that group.
  const novelTag = chapter.tags[0];
  const novelMeta = novelTag ? getNovelMeta(novelTag.slug, novelTag.name) : null;

  const siblings = allChapters
    .filter((c) => (c.tags[0]?.slug ?? 'other') === (novelTag?.slug ?? 'other'))
    .sort((a, b) => (a.publishedAt ?? '').localeCompare(b.publishedAt ?? ''));
  const idx = siblings.findIndex((c) => c.id === chapter.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const html = renderPostContent(chapter.content);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <ViewCounter postId={chapter.id} />

      {/* Breadcrumb to the novel library */}
      <Link
        href="/novels"
        className="text-sm font-semibold text-[var(--color-primary)]/60 hover:text-[var(--color-primary)] transition-colors mb-8 inline-flex items-center gap-1"
      >
        ← {novelMeta?.title ?? 'Novels'}
      </Link>

      <header className="mt-6 mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-primary)] leading-tight">
          {chapter.title}
        </h1>
        {chapter.publishedAt && (
          <p className="text-xs text-[var(--color-primary)]/50 mt-3 font-semibold uppercase tracking-wide">
            {formatDate(chapter.publishedAt)}
          </p>
        )}
      </header>

      <div
        className="prose prose-lg max-w-none text-[var(--color-primary)] prose-headings:text-[var(--color-primary)] prose-p:text-[var(--color-primary)] prose-strong:text-[var(--color-primary)] prose-a:text-[var(--color-primary)]"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Ko-fi support block */}
      {settings.kofiLink && (
        <div className="my-16 p-8 border border-[var(--color-primary)]/20 flex flex-col sm:flex-row items-center gap-6 justify-between bg-[var(--color-primary)]/5">
          <div>
            <h3 className="text-xl font-black mb-1 text-[var(--color-primary)]">Enjoying the story?</h3>
            <p className="text-sm font-medium opacity-80 text-[var(--color-primary)]">
              Support the translator by buying a coffee.
            </p>
          </div>
          <a
            href={settings.kofiLink}
            target="_blank"
            rel="noreferrer"
            className="whitespace-nowrap flex items-center gap-2 px-6 py-3 font-bold border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] transition-colors duration-300"
          >
            <Coffee className="w-5 h-5" /> Support
          </a>
        </div>
      )}

      {/* Prev / next navigation */}
      <nav className="flex items-center justify-between mt-8 pt-8 border-t border-[var(--color-primary)]/10">
        {prev ? (
          <Link
            href={`/novels/${prev.slug}`}
            className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/novels/${next.slug}`}
            className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:opacity-70 transition-opacity"
          >
            Next <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
