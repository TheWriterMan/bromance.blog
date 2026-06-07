'use client';

import React from 'react';
import { PenTool } from 'lucide-react';

interface BlogHeaderProps {
  onEnterCMS?: () => void;
  onResetFilters: () => void;
}

export default function BlogHeader({ onEnterCMS, onResetFilters }: BlogHeaderProps) {
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

        <div className="flex items-center space-x-3">
          <button
            onClick={onEnterCMS}
            className="inline-flex items-center space-x-2 px-4 py-2 border border-stone-300 hover:border-stone-400 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-500 rounded text-xs font-serif uppercase tracking-widest text-stone-800 transition-all cursor-pointer"
            id="btn-cms-admin"
            aria-label="Open Editor Panel"
          >
            <PenTool className="h-3.5 w-3.5 text-stone-500" />
            <span>Journal Desk</span>
          </button>
        </div>
      </div>
    </header>
  );
}
