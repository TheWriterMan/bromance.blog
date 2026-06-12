import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Coffee, ChevronLeft, ChevronRight } from 'lucide-react';
import { getChapter, getCollectionBySlug, getSiteSettings } from '@/lib/blog-data';
import { renderPostContent } from '@/lib/tiptap-html';
import { formatDate } from '@/lib/utils';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ workSlug: string; chapterSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { workSlug, chapterSlug } = await params;
  const result = await getChapter(workSlug, chapterSlug);
  if (!result) return { title: 'Chapter not found' };
  return {
    title: result.chapter.title,
    robots: { index: true, follow: true },
  };
}

export default async function ChapterPage({ params }: PageProps) {
  const { workSlug, chapterSlug } = await params;

  const [chapterResult, workResult, settings] = await Promise.all([
    getChapter(workSlug, chapterSlug),
    getCollectionBySlug(workSlug),
    getSiteSettings(),
  ]);

  if (!chapterResult) notFound();

  const { chapter, prev, next } = chapterResult;
  const workName = workResult?.work.name ?? workSlug;

  // Locked chapter — show Ko-fi paywall
  if (chapter.locked) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <Link
          href={`/novels/${workSlug}`}
          className="text-sm font-semibold text-[var(--color-primary)]/60 hover:text-[var(--color-primary)] transition-colors mb-8 inline-flex items-center gap-1"
        >
          ← {workName}
        </Link>
        <h1 className="text-3xl font-extrabold text-[var(--color-primary)] mt-8 mb-4">
          {chapter.title}
        </h1>
        <div className="my-12 p-8 border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
          <h2 className="text-xl font-black mb-3 text-[var(--color-primary)]">Premium Chapter</h2>
          <p className="text-sm text-[var(--color-primary)]/70 mb-6">
            This chapter is locked. Support the translator on Ko-fi to unlock it.
          </p>
          {settings.kofiLink && (
            <a
              href={settings.kofiLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 font-bold border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] transition-colors duration-300"
            >
              <Coffee className="w-5 h-5" /> Unlock on Ko-fi
            </a>
          )}
        </div>
      </div>
    );
  }

  const html = renderPostContent(chapter.content);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <Link
        href={`/novels/${workSlug}`}
        className="text-sm font-semibold text-[var(--color-primary)]/60 hover:text-[var(--color-primary)] transition-colors mb-8 inline-flex items-center gap-1"
      >
        ← {workName}
      </Link>

      <header className="mt-6 mb-10">
        {chapter.chapterNumber > 0 && (
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]/50 mb-2">
            Chapter {chapter.chapterNumber}
          </p>
        )}
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-primary)] leading-tight">
          {chapter.title}
        </h1>
        {chapter.publishedAt && (
          <p className="text-xs text-[var(--color-primary)]/50 mt-3 font-semibold uppercase tracking-wide">
            {formatDate(chapter.publishedAt)}
          </p>
        )}
      </header>

      {/* TODO: font/theme controls (interactive reader refactor — Step 10) */}

      {/* Chapter content */}
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
            href={`/novels/${workSlug}/${prev}`}
            className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:opacity-70 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/novels/${workSlug}/${next}`}
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
