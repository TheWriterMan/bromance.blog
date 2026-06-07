'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  published_at: string;
  category?: { name: string };
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input when modal opens, clear debounce on close
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      // Reset state on open
      setQuery('');
      setResults([]);
      setSearched(false);
    } else {
      // Clear pending debounce on close
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?status=published&search=${encodeURIComponent(q)}&limit=8&excludeContent=true`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.items || data || []);
      }
    } catch {} finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Search posts"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden animate-fade-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-200 dark:border-stone-700">
          <Search className="h-5 w-5 text-stone-400 dark:text-stone-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search posts..."
            className="flex-1 bg-transparent text-lg text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setSearched(false); inputRef.current?.focus(); }}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-mono text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {loading && (
            <div className="px-5 py-8 text-center">
              <div className="inline-block w-5 h-5 border-2 border-stone-300 dark:border-stone-600 border-t-stone-600 dark:border-t-stone-300 rounded-full animate-spin" />
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="px-5 py-8 text-center text-stone-500 dark:text-stone-400 text-sm">
              No posts found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul className="py-2">
              {results.map((post) => (
                <li key={post.id}>
                  <a
                    href={`/${post.slug}`}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                    onClick={onClose}
                  >
                    <FileText className="h-4 w-4 text-stone-400 dark:text-stone-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                        {post.title}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {post.category?.name && <span>{post.category.name} &middot; </span>}
                        {formatDate(post.published_at)}
                      </p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}

          {!loading && !searched && (
            <div className="px-5 py-6 text-center text-stone-400 dark:text-stone-500 text-sm">
              Start typing to search...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
