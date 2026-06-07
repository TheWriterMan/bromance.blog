'use client';

import React from 'react';
import { Category } from '@/lib/db';

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
        All Dossiers
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-stone-500 ${
            selectedCategory === cat.id
              ? 'bg-stone-800 text-stone-50'
              : 'text-stone-500 hover:text-stone-900 border border-transparent hover:border-stone-300'
          }`}
          id={`btn-category-${cat.slug}`}
          aria-pressed={selectedCategory === cat.id}
        >
          {cat.name}
        </button>
      ))}
    </nav>
  );
}
