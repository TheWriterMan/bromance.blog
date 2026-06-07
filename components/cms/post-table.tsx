'use client';

import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';

interface PostTableProps {
  posts: any[];
  onEditPost: (id: string) => void;
  onDeletePost: (id: string) => void;
}

export default function PostTable({ posts, onEditPost, onDeletePost }: PostTableProps) {
  return (
    <table className="w-full text-left text-sm whitespace-nowrap" id="post-table">
      <thead className="bg-zinc-50/50 border-b border-zinc-200 text-zinc-500 font-medium">
        <tr>
          <th className="px-6 py-3">Title</th>
          <th className="px-6 py-3">Status</th>
          <th className="px-6 py-3">Date</th>
          <th className="px-6 py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
        {posts.map((post) => (
          <tr key={post.id} className="hover:bg-zinc-50 transition-colors" id={`row-post-${post.id}`}>
            <td className="px-6 py-4 font-medium text-zinc-900 w-full max-w-sm truncate whitespace-normal">
              {post.title}
            </td>
            <td className="px-6 py-4">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                post.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                post.status === 'draft' ? 'bg-zinc-100 text-zinc-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
              </span>
            </td>
            <td className="px-6 py-4 text-zinc-500">
              {new Date(post.created_at).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 text-right">
              <div className="inline-flex space-x-2">
                <button
                  onClick={() => onEditPost(post.id)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  id={`btn-edit-post-${post.id}`}
                  aria-label={`Edit post ${post.title}`}
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDeletePost(post.id)}
                  className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
                  id={`btn-delete-post-${post.id}`}
                  aria-label={`Delete post ${post.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
