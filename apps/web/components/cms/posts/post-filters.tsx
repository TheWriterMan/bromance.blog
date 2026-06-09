'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

type StatusTab = 'all' | 'published' | 'draft' | 'scheduled';

interface PostFiltersProps {
  activeTab: StatusTab;
  onTabChange: (tab: StatusTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categories: { id: string; name: string }[];
  selectedCategory: string | null;
  onCategoryChange: (id: string | null) => void;
  counts: { all: number; published: number; draft: number; scheduled: number };
}

const TABS: { key: StatusTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
  { key: 'scheduled', label: 'Scheduled' },
];

export default function PostFilters({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  counts,
}: PostFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external changes
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounced search
  function handleSearchInput(value: string) {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 300);
  }

  return (
    <div className="space-y-4">
      {/* Status tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200 overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors min-h-[44px] ${
              activeTab === key
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs text-zinc-400">
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Category filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search posts…"
            className="w-full pl-9 pr-9 py-2.5 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 transition-colors"
          />
          {localSearch && (
            <button
              onClick={() => { setLocalSearch(''); onSearchChange(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-700"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category dropdown */}
        <select
          value={selectedCategory || ''}
          onChange={(e) => onCategoryChange(e.target.value || null)}
          className="px-3 py-2.5 text-sm border border-zinc-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 transition-colors min-h-[44px] sm:w-48"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
