import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { getCollections } from '@/lib/blog-data';
import { getCloudinaryUrl } from '@/lib/utils';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Novels — Work Library',
  description: 'Browse original web novel translations: ongoing and completed works.',
};

export default async function NovelsPage() {
  const works = await getCollections('novels');

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-12">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--color-primary)] mb-3">
          Novel Library
        </h1>
        <p className="text-[var(--color-primary)]/70 font-medium">
          Select a work to read
        </p>
      </header>

      {works.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <BookOpen className="w-16 h-16 text-[var(--color-primary)]/20 mb-6" />
          <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-2">No works yet</h2>
          <p className="text-[var(--color-primary)]/60 max-w-sm">
            Check back soon — new translations are on the way.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {works.map((work) => (
            <Link
              key={work.id}
              href={`/novels/${work.slug}`}
              className="group flex flex-col gap-3"
            >
              <div className="relative overflow-hidden aspect-[2/3] bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10">
                {work.coverImage ? (
                  <img
                    src={getCloudinaryUrl(work.coverImage, 'featured')}
                    alt={work.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-[var(--color-primary)]/20" />
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
              <div>
                <h3 className="text-sm font-bold leading-snug text-[var(--color-primary)] line-clamp-2 group-hover:underline decoration-2 underline-offset-2">
                  {work.name}
                </h3>
                <p className="text-xs text-[var(--color-primary)]/60 mt-1">
                  {work.chapterCount} ch
                  {work.rating > 0 && (
                    <span> · ★ {work.rating}</span>
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
