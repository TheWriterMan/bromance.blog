'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import Logo from '@/components/ui/logo';
import ThemeToggle from './theme-toggle';
import SearchModal from './search-modal';
import { Category } from '@/lib/db';

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
  const pathname = usePathname();

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

  const isHome = pathname === '/';

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md" id="blog-header">
        {/* Top bar: Logo + actions */}
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            onClick={onResetFilters}
            className="cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-stone-500 rounded"
            aria-label="Home"
          >
            <Logo size="sm" />
          </Link>

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
        {categories.length > 0 && (
          <nav className="border-t border-stone-100 dark:border-stone-800" aria-label="Category Navigation">
            <div className="max-w-6xl mx-auto px-6 flex items-center gap-1 overflow-x-auto scrollbar-none py-2">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest whitespace-nowrap transition-all ${
                  isHome && !selectedCategory
                    ? 'bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                All
              </Link>
              {categories.map((cat) => {
                const active = selectedCategory === cat.id || pathname === `/category/${cat.slug}`;
                return (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest whitespace-nowrap transition-all ${
                      active
                        ? 'bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    {cat.name}
                  </Link>
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
