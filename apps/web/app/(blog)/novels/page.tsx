import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { getNovelChapters } from '@/lib/blog-data';
import type { BlogPost } from '@/lib/blog-data';
import { getNovelMeta } from '@/lib/novels-meta';
import { getCloudinaryUrl, formatDate } from '@/lib/utils';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Novels',
  description: 'Browse novels and their chapters.',
};

interface NovelGroup {
  slug: string;
  name: string;
  chapters: BlogPost[];
}

/** Group novel chapters (posts) by their first tag = the novel name. */
function groupByNovel(chapters: BlogPost[]): NovelGroup[] {
  const groups = new Map<string, NovelGroup>();
  for (const ch of chapters) {
    const tag = ch.tags[0];
    const slug = tag?.slug ?? 'other';
    const name = tag?.name ?? 'Other';
    if (!groups.has(slug)) groups.set(slug, { slug, name, chapters: [] });
    groups.get(slug)!.chapters.push(ch);
  }
  return [...groups.values()];
}

export default async function NovelsPage() {
  const chapters = await getNovelChapters();
  const novels = groupByNovel(chapters);

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-12">
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--color-primary)]">Novels</h1>
        <p className="text-[var(--color-primary)]/60 mt-2">Ongoing and completed works, chapter by chapter.</p>
      </header>

      {novels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <BookOpen className="w-10 h-10 text-[var(--color-primary)]/30" />
          <p className="text-[var(--color-primary)]/50 text-sm">No novels published yet.</p>
        </div>
      ) : (
        <div className="space-y-16">
          {novels.map((novel) => {
            const meta = getNovelMeta(novel.slug, novel.name);
            return (
              <section key={novel.slug}>
                <div className="lg:flex lg:gap-8">
                  {/* Cover */}
                  <div className="shrink-0 w-full max-w-[160px] mx-auto lg:mx-0">
                    <div className="relative aspect-[2/3] overflow-hidden border border-[var(--color-primary)]/10 bg-[var(--color-primary)]/5">
                      {meta.coverImage ? (
                        <img
                          src={meta.coverImage.startsWith('http') ? meta.coverImage : getCloudinaryUrl(meta.coverImage, 'featured')}
                          alt={meta.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-10 h-10 text-[var(--color-primary)]/20" />
                        </div>
                      )}
                      <span
                        className={`absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          meta.status === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-zinc-900'
                        }`}
                      >
                        {meta.status}
                      </span>
                    </div>
                  </div>

                  {/* Details + chapters */}
                  <div className="flex-1 mt-6 lg:mt-0">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)] leading-tight">
                      {meta.title}
                    </h2>
                    {meta.altTitle && (
                      <p className="text-sm text-[var(--color-primary)]/60 mt-1 font-medium">{meta.altTitle}</p>
                    )}
                    {meta.author && (
                      <p className="text-xs text-[var(--color-primary)]/50 mt-1">by {meta.author}</p>
                    )}

                    {meta.genres && meta.genres.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {meta.genres.map((g) => (
                          <span key={g} className="text-xs font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1 rounded-full">
                            {g}
                          </span>
                        ))}
                      </div>
                    )}

                    {meta.synopsis && (
                      <p className="text-[var(--color-primary)] leading-relaxed text-sm whitespace-pre-line mt-4">
                        {meta.synopsis}
                      </p>
                    )}

                    {/* Chapter list */}
                    <div className="mt-6">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]/60 mb-3">
                        Chapters ({novel.chapters.length})
                      </h3>
                      <div className="flex flex-col divide-y divide-[var(--color-primary)]/10 border border-[var(--color-primary)]/10">
                        {novel.chapters.map((ch) => (
                          <Link
                            key={ch.id}
                            href={`/novels/${ch.slug}`}
                            className="flex items-center justify-between px-4 py-3 hover:bg-[var(--color-primary)]/5 transition-colors group"
                          >
                            <span className="text-sm font-semibold text-[var(--color-primary)] group-hover:underline decoration-2 underline-offset-2">
                              {ch.title}
                            </span>
                            {ch.publishedAt && (
                              <span className="text-xs text-[var(--color-primary)]/40 shrink-0 ml-4">
                                {formatDate(ch.publishedAt)}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
