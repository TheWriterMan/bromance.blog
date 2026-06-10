'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, X, Loader2 } from 'lucide-react';
import { getCloudinaryUrl } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  summary: string;
  featured_image: string;
  read_time: number;
}

export default function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setSearched(false);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/posts?status=published&search=${encodeURIComponent(query)}&limit=8&excludeContent=true`,
        );
        const data = await res.json();
        setResults(data.items || []);
        setSearched(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-auto mt-20 max-w-2xl w-[92%] bg-[var(--color-bg)] rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--color-primary)]/15 px-5 py-4">
          <Search className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts…"
            className="flex-1 bg-transparent outline-none text-[var(--color-primary)] placeholder:text-[var(--color-primary)]/40 text-lg"
          />
          {loading && <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]/60" />}
          <button
            onClick={onClose}
            aria-label="Close search"
            className="p-2 -mr-2 rounded-full hover:bg-[var(--color-primary)]/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-[var(--color-primary)]" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {searched && results.length === 0 && !loading && (
            <p className="px-5 py-10 text-center text-sm font-semibold text-[var(--color-primary)]/60">
              No posts found for “{query}”.
            </p>
          )}
          {results.map((post) => (
            <Link
              key={post.id}
              href={`/${post.slug}`}
              onClick={onClose}
              className="flex gap-4 items-center px-5 py-3 hover:bg-[var(--color-primary)]/5 transition-colors border-b border-[var(--color-primary)]/5 last:border-0"
            >
              <div className="w-16 h-16 shrink-0 overflow-hidden rounded bg-[var(--color-primary)]/5">
                <img
                  src={getCloudinaryUrl(post.featured_image, 'thumbnail')}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-[var(--color-primary)] line-clamp-1">{post.title}</h4>
                <p className="text-xs text-[var(--color-primary)]/60 line-clamp-1 mt-0.5">{post.summary}</p>
                <p className="text-[10px] uppercase tracking-wide font-bold text-[var(--color-primary)]/40 mt-1">
                  {post.read_time} min read
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
