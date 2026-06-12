'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen, Star, List, ArrowUpDown, ArrowLeft, ChevronLeft, ChevronRight,
  Lock, Coffee, Settings, Search, Book, Award, Sparkles, Info,
} from 'lucide-react';
import type { NovelWork, NovelChapter, NovelReview } from '@/lib/blog-data';
import { getCloudinaryUrl } from '@/lib/utils';

// ─── Internal types ─────────────────────────────────────────────────────────

interface Chapter {
  id: string;
  number: number;
  title: string;
  publishedAt: string;
  isLocked?: boolean;
  content: string;
}

interface Novel {
  id: string;
  title: string;
  altTitle: string;
  coverImage: string;
  status: 'Ongoing' | 'Completed';
  rating: number;
  reviewsCount: number;
  views: string;
  genre: string[];
  tags: string[];
  synopsis: string;
  chapters: Chapter[];
}

interface ReviewItem {
  id?: string;
  user: string;
  rating: number;
  text: string;
  date: string;
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface ShowcaseProps {
  /** Works from blog-data (server-fetched). */
  works: NovelWork[];
  /** Chapters per work, keyed by work id. */
  chaptersByWork: Record<string, NovelChapter[]>;
  /** Ko-fi URL from settings. */
  kofiLink: string;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapWork(work: NovelWork, chapters: NovelChapter[]): Novel {
  const meta = work.metadata as Record<string, unknown>;
  const genres = Array.isArray(meta.genres) ? (meta.genres as string[]) : [];
  const tags = Array.isArray(meta.tags) ? (meta.tags as string[]) : [];
  const viewsLabel =
    typeof meta.viewsLabel === 'string'
      ? meta.viewsLabel
      : work.views > 0
        ? work.views.toLocaleString()
        : '—';

  const mappedChapters: Chapter[] = chapters.map((ch) => ({
    id: ch.id,
    number: ch.chapterNumber,
    title: ch.title,
    publishedAt: ch.publishedAt ?? '',
    isLocked: ch.locked,
    content: '', // loaded lazily when chapter opens
  }));

  return {
    id: work.id,
    title: work.name,
    altTitle: typeof meta.altTitle === 'string' ? meta.altTitle : '',
    coverImage: work.coverImage
      ? getCloudinaryUrl(work.coverImage, 'featured')
      : 'https://picsum.photos/seed/novel/600/800',
    status: work.status === 'completed' ? 'Completed' : 'Ongoing',
    rating: work.rating,
    reviewsCount: work.reviewsCount,
    views: viewsLabel,
    genre: genres,
    tags,
    synopsis: work.description,
    chapters: mappedChapters,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MyWorkShowcase({ works, chaptersByWork, kofiLink }: ShowcaseProps) {
  const novels = useMemo(
    () => works.map((w) => mapWork(w, chaptersByWork[w.id] ?? [])),
    [works, chaptersByWork],
  );

  const [selected, setSelected] = useState<Novel>(novels[0] ?? null!);
  const [tab, setTab] = useState<'synopsis' | 'chapters' | 'reviews'>('synopsis');
  const [sortDesc, setSortDesc] = useState(false);
  const [chapterSearch, setChapterSearch] = useState('');
  const [reader, setReader] = useState<Chapter | null>(null);
  const [readerContent, setReaderContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [readerTheme, setReaderTheme] = useState<'classic' | 'sepia' | 'dark'>('classic');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewAuthor, setReviewAuthor] = useState('');

  // Sync selected when novels change (e.g. server re-render)
  useEffect(() => {
    if (novels.length > 0 && (!selected || !novels.find((n) => n.id === selected.id))) {
      setSelected(novels[0]);
    }
  }, [novels]);

  // Load reviews when works tab opens or selected work changes
  const loadReviews = useCallback(async (workId: string) => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/collections/${workId}/reviews`);
      if (res.ok) {
        const data: Array<{ id: string; author_name: string | null; rating: number; content: string; created_at: string }> =
          await res.json();
        setReviews(
          data.map((r) => ({
            id: r.id,
            user: r.author_name || 'Anonymous',
            rating: r.rating,
            text: r.content,
            date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          })),
        );
      }
    } catch {
      /* silent */
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'reviews' && selected) {
      loadReviews(selected.id);
    }
  }, [tab, selected?.id]);

  // Load chapter content lazily when reader opens
  useEffect(() => {
    if (!reader) return;
    // find the NovelChapter for this chapter to get its post id
    const novelChapters = chaptersByWork[selected?.id ?? ''] ?? [];
    const nc = novelChapters.find((c) => c.id === reader.id);
    if (!nc) {
      setReaderContent('');
      return;
    }
    if (nc.locked) {
      setReaderContent('');
      return;
    }
    setLoadingContent(true);
    fetch(`/api/posts/${nc.id}`)
      .then((r) => r.json())
      .then((data) => {
        // API returns post with content field (TipTap JSON or HTML)
        setReaderContent(data?.content ?? data?.html ?? '');
      })
      .catch(() => setReaderContent(''))
      .finally(() => setLoadingContent(false));
  }, [reader?.id]);

  const sortedChapters = useMemo(() => {
    if (!selected) return [];
    const filtered = selected.chapters.filter(
      (ch) =>
        ch.title.toLowerCase().includes(chapterSearch.toLowerCase()) ||
        `chapter ${ch.number}`.includes(chapterSearch.toLowerCase()),
    );
    return [...filtered].sort((a, b) => (sortDesc ? b.number - a.number : a.number - b.number));
  }, [selected, chapterSearch, sortDesc]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewText.trim() || !selected) return;
    const optimistic: ReviewItem = {
      user: reviewAuthor.trim() || 'GuestReader',
      rating,
      text: reviewText,
      date: 'Just now',
    };
    setReviews((prev) => [optimistic, ...prev]);
    setReviewText('');
    setReviewAuthor('');

    try {
      const res = await fetch(`/api/collections/${selected.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName: optimistic.user, rating, content: reviewText.trim() }),
      });
      if (res.ok) {
        // Refetch to get server-side id + proper timestamp
        await loadReviews(selected.id);
      }
    } catch {
      /* optimistic remains */
    }
  }

  if (!novels.length) {
    return (
      <div className="max-w-7xl mx-auto w-full px-6 py-8">
        <div className="flex items-center gap-2 text-xs font-semibold mb-6 p-3 rounded border border-amber-300 bg-amber-50 text-amber-800">
          <Info className="w-4 h-4 shrink-0" />
          No works published yet — check back soon.
        </div>
      </div>
    );
  }

  if (reader && selected) {
    const chapterLocked = selected.chapters.find((c) => c.id === reader.id)?.isLocked ?? false;
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => { setReader(null); setReaderContent(''); }}
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#cc0000] hover:underline min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Novel Index
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setReaderTheme((t) => (t === 'classic' ? 'sepia' : t === 'sepia' ? 'dark' : 'classic'))}
              className="p-2 border rounded hover:bg-black/5 flex items-center gap-1 text-xs font-bold uppercase tracking-wider min-h-[44px]"
            >
              <Settings className="w-4 h-4" /> {readerTheme}
            </button>
            <div className="flex items-center border rounded overflow-hidden">
              <button onClick={() => setFontSize((s) => (s === 'xl' ? 'lg' : s === 'lg' ? 'md' : 'sm'))} className="px-3 py-1 bg-black/5 border-r text-xs font-black min-h-[40px]">-A</button>
              <button onClick={() => setFontSize((s) => (s === 'sm' ? 'md' : s === 'md' ? 'lg' : 'xl'))} className="px-3 py-1 bg-black/5 border-l text-xs font-black min-h-[40px]">+A</button>
            </div>
          </div>
        </div>

        <div
          className={`p-8 md:p-12 border rounded-md shadow-sm ${
            readerTheme === 'sepia'
              ? 'bg-[#fcf8f2] text-[#5c3a21] border-[#e6d0b3]'
              : readerTheme === 'dark'
                ? 'bg-[#18181b] text-zinc-300 border-zinc-800'
                : 'bg-white text-zinc-800 border-zinc-200'
          }`}
        >
          <div className="text-center mb-10 border-b pb-8 border-current/10">
            <span className="text-xs uppercase tracking-widest font-black text-[#cc0000] mb-2 block">{selected.title}</span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
              Chapter {reader.number}: {reader.title}
            </h1>
          </div>

          {chapterLocked ? (
            <div className="text-center py-16 px-4 bg-[#cc0000]/5 rounded-lg border border-[#cc0000]/20 max-w-lg mx-auto my-12">
              <Lock className="w-12 h-12 mx-auto text-[#cc0000] mb-4" />
              <h3 className="text-2xl font-bold text-[#cc0000] mb-2">Premium Chapter</h3>
              <p className="text-sm text-zinc-600 mb-6">Support the translator and unlock early chapters by buying a coffee on Ko-Fi.</p>
              <a href={kofiLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-[#cc0000] text-white font-extrabold uppercase text-sm tracking-widest rounded hover:bg-red-800 transition-colors">
                <Coffee className="w-4 h-4" /> Unlock on Ko-Fi
              </a>
            </div>
          ) : loadingContent ? (
            <div className="py-20 text-center text-zinc-400 text-sm">Loading chapter…</div>
          ) : (
            <div
              className={`leading-relaxed space-y-6 ${fontSize === 'sm' ? 'text-base' : fontSize === 'md' ? 'text-lg' : fontSize === 'lg' ? 'text-xl' : 'text-2xl'}`}
              dangerouslySetInnerHTML={{ __html: readerContent }}
            />
          )}

          <div className="flex justify-between items-center border-t border-current/10 pt-8 mt-12 gap-4">
            <button
              disabled={reader.number === 1}
              onClick={() => {
                const prev = selected.chapters.find((c) => c.number === reader.number - 1);
                if (prev) { setReader(prev); setReaderContent(''); }
              }}
              className="px-4 py-2 border border-current rounded-md text-xs font-bold uppercase tracking-wider hover:bg-current/5 disabled:opacity-30 flex items-center gap-2 min-h-[44px]"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={() => { setReader(null); setReaderContent(''); setTab('chapters'); }}
              className="px-4 py-2 border border-current rounded-md text-xs font-bold uppercase tracking-wider hover:bg-current/5 flex items-center gap-2 min-h-[44px]"
            >
              <List className="w-4 h-4" /> Contents
            </button>
            <button
              disabled={reader.number === selected.chapters.length}
              onClick={() => {
                const next = selected.chapters.find((c) => c.number === reader.number + 1);
                if (next) { setReader(next); setReaderContent(''); }
              }}
              className="px-4 py-2 border border-current rounded-md text-xs font-bold uppercase tracking-wider hover:bg-current/5 disabled:opacity-30 flex items-center gap-2 min-h-[44px]"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-8">
      {/* Series selector */}
      <div className="flex gap-4 overflow-x-auto pb-4 mb-8 border-b border-[var(--color-primary)]/10">
        {novels.map((novel) => (
          <button
            key={novel.id}
            onClick={() => { setSelected(novel); setTab('synopsis'); }}
            className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 whitespace-nowrap transition-all min-h-[44px] ${
              selected?.id === novel.id ? 'bg-[#cc0000] text-white shadow-md' : 'bg-black/5 hover:bg-black/10 text-zinc-700'
            }`}
          >
            <Book className="w-3.5 h-3.5" /> {novel.title.split(' (')[0]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: cover + stats + actions */}
        <div className="lg:col-span-4 flex flex-col items-center lg:items-stretch">
          <div className="aspect-[3/4] w-full max-w-[340px] mx-auto overflow-hidden rounded-md shadow-2xl relative border-4 border-double border-[#cc0000]/30">
            <img src={selected.coverImage} alt={selected.title} className="w-full h-full object-cover" />
            <span className={`absolute top-4 left-4 text-[10px] tracking-widest font-black uppercase text-white px-3 py-1 rounded shadow-md ${selected.status === 'Ongoing' ? 'bg-amber-600' : 'bg-green-700'}`}>
              {selected.status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full max-w-[340px] mx-auto my-6 border-y border-[#cc0000]/20 py-4 text-center">
            <div>
              <span className="block text-xs font-bold text-zinc-400 uppercase mb-1">Chapters</span>
              <span className="text-xl font-extrabold text-[#cc0000]">{selected.chapters.length}</span>
            </div>
            <div className="border-x border-[#cc0000]/10">
              <span className="block text-xs font-bold text-zinc-400 uppercase mb-1">Rating</span>
              <span className="text-xl font-extrabold text-[#cc0000] flex items-center justify-center gap-0.5">
                {selected.rating > 0 ? selected.rating : '—'} <Star className="w-4 h-4 fill-[#cc0000] stroke-none" />
              </span>
            </div>
            <div>
              <span className="block text-xs font-bold text-zinc-400 uppercase mb-1">Views</span>
              <span className="text-xl font-extrabold text-[#cc0000]">{selected.views}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-[340px] mx-auto">
            <button
              onClick={() => selected.chapters[0] && setReader(selected.chapters[0])}
              disabled={selected.chapters.length === 0}
              className="w-full py-3 bg-[#cc0000] text-white font-extrabold uppercase text-sm tracking-widest hover:bg-red-800 transition-colors rounded flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
            >
              <BookOpen className="w-5 h-5" /> Read Chapter 1
            </button>
            <a href={kofiLink} target="_blank" rel="noreferrer" className="w-full py-3 border border-[#cc0000] text-[#cc0000] font-extrabold uppercase text-sm tracking-widest rounded hover:bg-[#cc0000]/5 flex items-center justify-center gap-2 min-h-[44px]">
              <Coffee className="w-5 h-5" /> Support This Translation
            </a>
          </div>
        </div>

        {/* Right: title, genres, tabs */}
        <div className="lg:col-span-8">
          <div className="flex flex-wrap gap-2 mb-3">
            {selected.genre.map((g) => (
              <span key={g} className="text-xs font-black uppercase tracking-widest bg-[#cc0000] text-white px-3 py-1 rounded">{g}</span>
            ))}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-[#cc0000] tracking-tight leading-tight">{selected.title}</h1>
          {selected.altTitle && (
            <p className="text-sm font-extrabold text-zinc-400 tracking-widest uppercase mt-2">
              Original: <span className="text-[#cc0000]">{selected.altTitle}</span>
            </p>
          )}

          <div className="flex border-b border-zinc-200 mt-8 mb-6">
            {(['synopsis', 'chapters', 'reviews'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-3 px-5 font-extrabold text-sm uppercase tracking-wider border-b-2 transition-all min-h-[44px] ${tab === t ? 'border-[#cc0000] text-[#cc0000]' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
              >
                {t === 'synopsis' ? 'Synopsis' : t === 'chapters' ? `Chapters (${selected.chapters.length})` : `Reviews (${reviews.length})`}
              </button>
            ))}
          </div>

          {tab === 'synopsis' && (
            <div className="space-y-8">
              <div className="bg-black/[0.02] p-6 rounded-md border border-zinc-100">
                <h3 className="text-lg font-bold text-[#cc0000] mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5" /> Synopsis</h3>
                <div className="text-zinc-700 leading-relaxed space-y-4 whitespace-pre-line">{selected.synopsis}</div>
              </div>

              {/* Tags */}
              {selected.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-[#cc0000] mb-4 flex items-center gap-2"><Award className="w-5 h-5" /> Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.tags.map((tag) => (
                      <span key={tag} className="text-xs font-bold bg-black/5 text-zinc-600 px-3.5 py-1.5 rounded-sm border border-zinc-200">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Support Goal + Weekly Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-[#cc0000]/10 p-5 rounded bg-[#cc0000]/[0.01]">
                  <h4 className="font-extrabold text-sm text-[#cc0000] mb-2 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Weekly Schedule
                  </h4>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    We release <strong>3 new chapters</strong> every week on Monday, Wednesday, and Friday at 18:00 UTC.
                  </p>
                </div>
                <div className="border border-[#cc0000]/10 p-5 rounded bg-[#cc0000]/[0.01]">
                  <h4 className="font-extrabold text-sm text-[#cc0000] mb-2 uppercase tracking-wide flex items-center gap-2">
                    <Coffee className="w-4 h-4" /> Support Goal
                  </h4>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    For every <strong>$15 raised</strong> on Ko-Fi, we translate and release a guaranteed extra VIP/bonus chapter!
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === 'chapters' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-black/[0.02] p-4 border border-zinc-200 rounded">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input value={chapterSearch} onChange={(e) => setChapterSearch(e.target.value)} placeholder="Search chapters…" className="w-full pl-9 pr-4 py-2 border rounded text-xs outline-none bg-white font-semibold text-zinc-700 focus:border-[#cc0000] min-h-[40px]" />
                </div>
                <button onClick={() => setSortDesc(!sortDesc)} className="w-full sm:w-auto px-4 py-2 bg-white border rounded text-xs font-bold uppercase tracking-wider text-zinc-600 hover:bg-black/5 flex items-center justify-center gap-2 min-h-[44px]">
                  <ArrowUpDown className="w-3.5 h-3.5" /> {sortDesc ? 'Newest' : 'Oldest'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sortedChapters.map((ch) => (
                  <button key={ch.id} onClick={() => setReader(ch)} className="group p-4 border border-zinc-100 bg-white hover:border-[#cc0000] cursor-pointer rounded transition-all flex justify-between items-center text-left min-h-[44px]">
                    <div className="overflow-hidden pr-4">
                      <span className="text-[10px] font-black text-[#cc0000] tracking-wider uppercase">Chapter {ch.number}</span>
                      <h4 className="font-bold text-sm text-zinc-800 line-clamp-1 group-hover:text-[#cc0000]">{ch.title}</h4>
                      <span className="text-[10px] font-semibold text-zinc-400 block">{ch.publishedAt}</span>
                    </div>
                    {ch.isLocked ? (
                      <span className="bg-[#cc0000]/5 text-[#cc0000] p-2 rounded-full border border-[#cc0000]/10"><Lock className="w-3.5 h-3.5" /></span>
                    ) : (
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-[10px] font-black uppercase border border-green-100">FREE</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'reviews' && (
            <div className="space-y-6">
              <form onSubmit={submitReview} className="border p-6 bg-black/[0.02] border-zinc-200 rounded">
                <h4 className="font-extrabold text-sm uppercase tracking-widest text-[#cc0000] mb-4">Write a Review</h4>
                <div className="mb-4">
                  <input
                    value={reviewAuthor}
                    onChange={(e) => setReviewAuthor(e.target.value)}
                    placeholder="Your name (optional)"
                    className="w-full p-2 border rounded text-sm bg-white outline-none focus:border-[#cc0000] text-zinc-700 font-semibold mb-3"
                  />
                </div>
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" onClick={() => setRating(s)} className="hover:scale-110 transition-transform">
                      <Star className={`w-5 h-5 ${s <= rating ? 'fill-[#cc0000] text-[#cc0000]' : 'text-zinc-300'}`} />
                    </button>
                  ))}
                </div>
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Share your thoughts on the translation, story, or characters…" required className="w-full p-3 border rounded text-sm bg-white outline-none focus:border-[#cc0000] min-h-[100px] mb-4 text-zinc-700 font-semibold" />
                <button type="submit" className="px-6 py-2 bg-[#cc0000] text-white font-extrabold text-xs uppercase tracking-widest hover:bg-red-800 transition-colors rounded min-h-[44px]">Submit Review</button>
              </form>

              {reviewsLoading ? (
                <div className="py-8 text-center text-zinc-400 text-sm">Loading reviews…</div>
              ) : (
                <div className="space-y-6">
                  {reviews.length === 0 && (
                    <p className="text-sm text-zinc-400 text-center py-6">No reviews yet — be the first!</p>
                  )}
                  {reviews.map((rev, idx) => (
                    <div key={rev.id ?? idx} className="p-5 border border-zinc-100 rounded bg-white flex gap-4">
                      <span className="w-12 h-12 rounded-full bg-[#cc0000] text-white flex items-center justify-center font-bold shrink-0">{rev.user[0]}</span>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-bold text-sm text-[#cc0000]">{rev.user}</span>
                          <span className="text-[10px] text-zinc-400 font-bold">{rev.date}</span>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-[#cc0000] text-[#cc0000]' : 'text-zinc-200'}`} />
                          ))}
                        </div>
                        <p className="text-sm text-zinc-600 leading-relaxed font-semibold">{rev.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
