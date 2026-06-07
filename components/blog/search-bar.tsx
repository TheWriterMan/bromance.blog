'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function SearchBar({ searchQuery, onSearchChange }: SearchBarProps) {
  return (
    <div className="space-y-3" id="search-bar">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-stone-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Keyword search..."
          className="w-full pl-9 pr-4 py-2 border-b-2 border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-stone-900 transition-colors font-mono text-sm placeholder:text-stone-400"
          id="search-input"
          aria-label="Search posts by title"
        />
      </div>
    </div>
  );
}
