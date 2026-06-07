'use client';

import React from 'react';
import { Component } from 'lucide-react';

interface CmsHeaderProps {
  onSeedDatabase: () => void;
  onExitCMS: () => void;
}

export default function CmsHeader({ onSeedDatabase, onExitCMS }: CmsHeaderProps) {
  return (
    <header className="bg-stone-50 border-b-2 border-stone-200 px-6 h-16 flex items-center justify-between sticky top-0 z-40" id="cms-header">
      <div className="flex items-center space-x-3 text-stone-900">
        <Component className="h-5 w-5 text-stone-800" />
        <span className="font-display font-bold text-xl tracking-tight">CMS</span>
      </div>
      <div className="flex overflow-hidden rounded bg-white border border-stone-300 shadow-sm text-xs font-mono uppercase tracking-widest font-semibold">
        <button
          onClick={onSeedDatabase}
          className="px-4 py-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition border-r border-stone-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-400"
          id="btn-seed-db"
          aria-label="Seed dashboard with mock database records"
        >
          Seed System
        </button>
        <button
          onClick={onExitCMS}
          className="px-4 py-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-400"
          id="btn-exit-cms"
          aria-label="Exit Desk and return to Archive"
        >
          Return to Archives
        </button>
      </div>
    </header>
  );
}
