'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Edit3, Trash2 } from 'lucide-react';
import StatusBadge from '@/components/cms/shared/status-badge';

interface PostRowProps {
  post: {
    id: string;
    title: string;
    status: 'draft' | 'published' | 'scheduled';
    updated_at: string;
    views: number;
    category?: { id: string; name: string } | null;
  };
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
}

export default function PostRow({ post, selected, onSelect, onDelete }: PostRowProps) {
  const router = useRouter();

  function handleRowClick(e: React.MouseEvent) {
    // Don't navigate if clicking checkbox or action buttons
    const target = e.target as HTMLElement;
    if (target.closest('input[type="checkbox"]') || target.closest('button')) return;
    router.push(`/cms/posts/${post.id}`);
  }

  return (
    <tr
      onClick={handleRowClick}
      className="hover:bg-zinc-50 transition-colors cursor-pointer border-b border-zinc-100 last:border-b-0"
    >
      {/* Checkbox */}
      <td className="pl-4 pr-2 py-3 w-10">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(post.id, e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 cursor-pointer"
          aria-label={`Select ${post.title}`}
        />
      </td>

      {/* Title */}
      <td className="px-3 py-3">
        <span className="text-sm font-medium text-zinc-900 line-clamp-1">{post.title}</span>
      </td>

      {/* Category */}
      <td className="px-3 py-3 hidden lg:table-cell">
        <span className="text-sm text-zinc-500">{post.category?.name || '—'}</span>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <StatusBadge status={post.status} />
      </td>

      {/* Updated */}
      <td className="px-3 py-3 hidden md:table-cell">
        <span className="text-sm text-zinc-500">
          {new Date(post.updated_at).toLocaleDateString()}
        </span>
      </td>

      {/* Views */}
      <td className="px-3 py-3 hidden md:table-cell">
        <span className="text-sm text-zinc-500">{(post.views || 0).toLocaleString()}</span>
      </td>

      {/* Actions */}
      <td className="px-3 py-3 text-right">
        <div className="inline-flex gap-1">
          <button
            onClick={() => router.push(`/cms/posts/${post.id}`)}
            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={`Edit ${post.title}`}
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(post.id)}
            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={`Delete ${post.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
