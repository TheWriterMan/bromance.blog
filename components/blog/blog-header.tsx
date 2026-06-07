'use client';

import React from 'react';

interface BlogHeaderProps {
  onResetFilters: () => void;
}

export default function BlogHeader({ onResetFilters }: BlogHeaderProps) {
  return (
    <header className="border-b border-stone-200 sticky top-0 bg-stone-50/90 backdrop-blur-md z-45" id="blog-header">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <button 
          onClick={onResetFilters}
          className="font-display font-bold text-2xl text-stone-900 tracking-tight cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-stone-500 rounded"
          aria-label="Home / Reset Filters"
        >
          Bro<span className="text-red-800">mance</span>
        </button>
      </div>
    </header>
  );
}
