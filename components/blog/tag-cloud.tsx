'use client';

import React from 'react';

interface TagCloudProps {
  posts: any[];
  selectedTag: string | null;
  onSelectTag: (tagSlug: string | null) => void;
}

export default function TagCloud({ posts, selectedTag, onSelectTag }: TagCloudProps) {
  const allUniqueTags = React.useMemo(() => {
    return Array.from(
      new Set(posts.flatMap(p => p.tags || []).map((t: any) => JSON.stringify(t)))
    ).map((tStr: string) => JSON.parse(tStr));
  }, [posts]);

  if (allUniqueTags.length === 0) return null;

  return (
    <nav aria-label="Tags" id="tag-cloud">
      <div className="flex flex-wrap gap-2" role="group">
        <button
          onClick={() => onSelectTag(null)}
          className={`px-3 py-1.5 border text-xs font-mono uppercase tracking-widest leading-none transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-500 ${
            !selectedTag ? 'bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100 text-white dark:text-stone-900 font-bold' : 'bg-transparent border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-400'
          }`}
          id="btn-tag-all"
          aria-pressed={!selectedTag}
        >
          All
        </button>
        {allUniqueTags.map((tag: any) => {
          const isSelected = selectedTag === tag.slug;
          return (
            <button
              key={tag.id}
              onClick={() => onSelectTag(isSelected ? null : tag.slug)}
              className={`px-3 py-1.5 border text-xs font-mono uppercase tracking-widest leading-none transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-500 ${
                isSelected ? 'bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100 text-white dark:text-stone-900 font-bold' : 'bg-transparent border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-400'
              }`}
              id={`btn-tag-${tag.slug}`}
              aria-pressed={isSelected}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
