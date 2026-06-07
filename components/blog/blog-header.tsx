'use client';

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import Logo from '@/components/ui/logo';
import ThemeToggle from './theme-toggle';
import SearchModal from './search-modal';
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
}

export default function BlogHeader({
  onResetFilters,
  categories = [],
  selectedCategory = null,
  onSelectCategory,
}: BlogHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function getCategoryIdBySlug(slug: string): string | null {
    const cat = categories.find(c => c.slug === slug);
    return cat ? cat.id : null;
  }

  function isActive(slug: string): boolean {
    const catId = getCategoryIdBySlug(slug);
    return catId !== null && selectedCategory === catId;
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md" id="blog-header">
        {/* Top bar: Logo + actions */}
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={onResetFilters}
            className="cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-stone-500 rounded"
            aria-label="Home / Reset Filters"
          >
            <Logo size="sm" />
          </button>

          <div className="flex items-center gap-1">
            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label="Search (Ctrl+K)"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Theme toggle */}
            <ThemeToggle />
          </div>
        </div>

        {/* Category navigation */}
        {onSelectCategory && (
          <nav className="border-t border-stone-100 dark:border-stone-800" aria-label="Category Navigation">
            <div className="max-w-6xl mx-auto px-6 flex items-center gap-1 overflow-x-auto scrollbar-none py-2">
              <button
                onClick={() => onSelectCategory(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest whitespace-nowrap transition-all ${
                  !selectedCategory
                    ? 'bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
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
                        ? 'bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900'
                        : !catId
                        ? 'text-stone-300 dark:text-stone-600 cursor-not-allowed'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
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

      {/* Search modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
