'use client';

import React from 'react';
import { Category } from '@/lib/db';

/**
 * Curated top-level nav categories.
 * These map to category slugs in the database.
 */
const NAV_CATEGORIES = [
  { label: 'Drama', slug: 'drama' },
  { label: 'Manga', slug: 'manga' },
  { label: 'Donghua', slug: 'donghua' },
  { label: 'Novel', slug: 'novel' },
  { label: 'Random', slug: 'random' },
];

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  // Map nav slugs to actual category IDs from the database
  function getCategoryIdBySlug(slug: string): string | null {
    const cat = categories.find(c => c.slug === slug);
    return cat ? cat.id : null;
  }

  // Check if the current selection matches a nav item
  function isActive(slug: string): boolean {
    const catId = getCategoryIdBySlug(slug);
    return catId !== null && selectedCategory === catId;
  }

  return (
    <nav aria-label="Category Filter" className="flex items-center space-x-4 border-y border-stone-200 py-3 overflow-x-auto scrollbar-none" id="category-filter">
      <button
        onClick={() => onSelectCategory(null)}
        className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-stone-500 ${
          !selectedCategory
            ? 'bg-stone-800 text-stone-50'
            : 'text-stone-500 hover:text-stone-900 border border-transparent hover:border-stone-300'
        }`}
        id="btn-category-all"
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
            className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-stone-500 ${
              active
                ? 'bg-stone-800 text-stone-50'
                : !catId
                ? 'text-stone-300 cursor-not-allowed'
                : 'text-stone-500 hover:text-stone-900 border border-transparent hover:border-stone-300'
            }`}
            id={`btn-category-${nav.slug}`}
            aria-pressed={active}
          >
            {nav.label}
          </button>
        );
      })}
    </nav>
  );
}
