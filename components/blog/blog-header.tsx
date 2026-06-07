'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import Logo from '@/components/ui/logo';
import { Category } from '@/lib/db';

const NAV_CATEGORIES = [
  { label: 'Drama', slug: 'drama' },
  { label: 'Manga', slug: 'manga' },
  { label: 'Donghua', slug: 'donghua' },
  { label: 'Novel', slug: 'novel' },
  { label: 'Random', slug: 'random' },
];

interface BlogHeaderProps {
  onResetFilters: () => void;
  categories?: Category[];
  selectedCategory?: string | null;
  onSelectCategory?: (categoryId: string | null) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function BlogHeader({
  onResetFilters,
  categories = [],
  selectedCategory = null,
  onSelectCategory,
  searchQuery = '',
  onSearchChange,
}: BlogHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  function getCategoryIdBySlug(slug: string): string | null {
    const cat = categories.find(c => c.slug === slug);
    return cat ? cat.id : null;
  }

  function isActive(slug: string): boolean {
    const catId = getCategoryIdBySlug(slug);
    return catId !== null && selectedCategory === catId;
  }

  return (
    <header className="border-b border-stone-200 sticky top-0 bg-stone-50/95 backdrop-blur-md z-50" id="blog-header">
      {/* Top bar: Logo + Search */}
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <button
          onClick={onResetFilters}
          className="cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-stone-500 rounded"
          aria-label="Home / Reset Filters"
        >
          <Logo size="sm" />
        </button>

        <div className="flex items-center gap-3">
          {/* Search toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            aria-label={searchOpen ? 'Close search' : 'Search (Ctrl+K)'}
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Search bar (collapsible) */}
      {searchOpen && (
        <div className="border-t border-stone-200 px-6 py-3 bg-white">
          <div className="max-w-6xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-stone-200 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent font-sans"
              aria-label="Search posts"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange?.('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category navigation */}
      {onSelectCategory && (
        <nav className="border-t border-stone-100 bg-stone-50/95" aria-label="Category Navigation">
          <div className="max-w-6xl mx-auto px-6 flex items-center gap-1 overflow-x-auto scrollbar-none py-2">
            <button
              onClick={() => onSelectCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest whitespace-nowrap transition-all ${
                !selectedCategory
                  ? 'bg-stone-900 text-stone-50'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
              }`}
              aria-pressed={!selectedCategory}
            >
              All
            </button>
            {NAV_CATEGORIES.map((nav) => {
              const catId = getCategoryIdBySlug(nav.slug);
              const active = isActive(nav.slug);
              return (
                <button
                  key={nav.slug}
                  onClick={() => onSelectCategory(active ? null : catId)}
                  disabled={!catId}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest whitespace-nowrap transition-all ${
                    active
                      ? 'bg-stone-900 text-stone-50'
                      : !catId
                      ? 'text-stone-300 cursor-not-allowed'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                  aria-pressed={active}
                >
                  {nav.label}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
