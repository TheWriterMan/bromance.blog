'use client';

import React from 'react';
import Logo from '@/components/ui/logo';

interface CmsHeaderProps {
  onExitCMS: () => void;
}

export default function CmsHeader({ onExitCMS }: CmsHeaderProps) {
  return (
    <header className="bg-stone-50 border-b-2 border-stone-200 px-6 h-16 flex items-center justify-between sticky top-0 z-40" id="cms-header">
      <div className="flex items-center space-x-3 text-stone-900">
        <Logo size="sm" showText={false} />
        <span className="font-display font-bold text-xl tracking-tight">CMS</span>
      </div>
      <div className="flex overflow-hidden rounded bg-white border border-stone-300 shadow-sm text-xs font-mono uppercase tracking-widest font-semibold">
        <button
          onClick={onExitCMS}
          className="px-4 py-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-400"
          id="btn-exit-cms"
          aria-label="Return to blog"
        >
          View Blog
        </button>
      </div>
    </header>
  );
}
