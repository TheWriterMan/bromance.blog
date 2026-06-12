import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen, Star, Eye, BookMarked } from 'lucide-react';
import { getCollectionBySlug } from '@/lib/blog-data';
import { getCloudinaryUrl, formatDate } from '@/lib/utils';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ workSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { workSlug } = await params;
  const result = await getCollectionBySlug(workSlug);
  if (!result) return { title: 'Work not found' };
  const { work } = result;
  const meta = work.metadata as Record<string, unknown>;
  return {
    title: `${work.name} — Novels`,
    description: work.description || (typeof meta.altTitle === 'string' ? meta.altTitle : undefined),
  };
}

export default async function WorkPage({ params }: PageProps) {
  const { workSlug } = await params;
  const result = await getCollectionBySlug(workSlug);
  if (!result) notFound();

  const { work, chapters } = result;
  const meta = work.metadata as Record<string, unknown>;
  const altTitle = typeof meta.altTitle === 'string' ? meta.altTitle : null;
  const genres = Array.isArray(meta.genres) ? (meta.genres as string[]) : [];

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-12">
      {/* Back link */}
      <Link
        href="/novels"
        className="text-sm font-semibold text-[var(--color-primary)]/60 hover:text-[var(--color-primary)] transition-colors mb-8 inline-flex items-center gap-1"
      >
        ← Novel Library
      </Link>

      <div className="mt-6 lg:flex lg:gap-12">
        {/* Cover */}
        <div className="shrink-0 w-full max-w-[200px] mx-auto lg:mx-0">
          <div className="relative aspect-[2/3] overflow-hidden border border-[var(--color-primary)]/10 bg-[var(--color-primary)]/5">
            {work.coverImage ? (
              <img
                src={getCloudinaryUrl(work.coverImage, 'featured')}
                alt={work.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-[var(--color-primary)]/20" />
              </div>
            )}
            <span
              className={`absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                work.status === 'completed'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-400 text-zinc-900'
              }`}
            >
              {work.status === 'completed' ? 'Completed' : 'Ongoing'}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 mt-8 lg:mt-0">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-primary)] leading-tight">
            {work.name}
          </h1>
          {altTitle && (
            <p className="text-sm text-[var(--color-primary)]/60 mt-1 font-medium">{altTitle}</p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-6">
            <div className="flex items-center gap-2 text-[var(--color-primary)]">
              <BookMarked className="w-4 h-4 opacity-60" />
              <span className="text-sm font-semibold">{work.chapterCount} chapters</span>
            </div>
            {work.rating > 0 && (
              <div className="flex items-center gap-2 text-[var(--color-primary)]">
                <Star className="w-4 h-4 opacity-60 fill-current" />
                <span className="text-sm font-semibold">{work.rating} / 5</span>
                <span className="text-xs text-[var(--color-primary)]/50">({work.reviewsCount} reviews)</span>
              </div>
            )}
            {work.views > 0 && (
              <div className="flex items-center gap-2 text-[var(--color-primary)]">
                <Eye className="w-4 h-4 opacity-60" />
                <span className="text-sm font-semibold">{work.views.toLocaleString()} views</span>
              </div>
            )}
          </div>

          {/* Genres */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {genres.map((g) => (
                <span
                  key={g}
                  className="text-xs font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1 rounded-full"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Synopsis */}
          {work.description && (
            <div className="mt-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]/60 mb-2">
                Synopsis
              </h2>
              <p className="text-[var(--color-primary)] leading-relaxed text-sm whitespace-pre-line">
                {work.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chapter list */}
      <div className="mt-16">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--color-primary)]/60 mb-6">
          Chapters ({chapters.length})
        </h2>
        {chapters.length === 0 ? (
          <p className="text-[var(--color-primary)]/50 text-sm">No chapters published yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-[var(--color-primary)]/10 border border-[var(--color-primary)]/10">
            {chapters.map((ch) => (
              <Link
                key={ch.id}
                href={`/novels/${workSlug}/${ch.slug}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-[var(--color-primary)]/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[var(--color-primary)]/40 w-10 shrink-0">
                    #{ch.chapterNumber || '—'}
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-primary)] group-hover:underline decoration-2 underline-offset-2">
                    {ch.title}
                  </span>
                  {ch.locked && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)]/60 rounded">
                      Locked
                    </span>
                  )}
                </div>
                {ch.publishedAt && (
                  <span className="text-xs text-[var(--color-primary)]/40 shrink-0 ml-4">
                    {formatDate(ch.publishedAt)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
