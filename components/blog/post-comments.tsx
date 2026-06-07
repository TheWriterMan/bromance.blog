'use client';

import React, { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface PostCommentsProps {
  postId: string;
}

export default function PostComments({ postId }: PostCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchComments() {
      try {
        const res = await fetch(`/api/posts/${postId}/comments`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setComments(data);
        }
      } catch {}
    }
    fetchComments();
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName: name.trim() || null, content: content.trim() }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [newComment, ...prev]);
        setContent('');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to post comment');
      }
    } catch {
      setError('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-display font-bold text-stone-900">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="space-y-4 border border-stone-200 rounded-lg p-4 bg-white">
        <div>
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent"
          />
        </div>
        <div>
          <textarea
            placeholder="Write a comment..."
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            maxLength={2000}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent resize-y"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="px-4 py-2 text-sm font-medium bg-stone-900 text-white rounded-md hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Posting...' : 'Post comment'}
        </button>
      </form>

      {/* Comment list */}
      {comments.length > 0 && (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="border-b border-stone-100 pb-4 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-stone-800">{comment.author_name}</span>
                <span className="text-xs text-stone-400">{formatDate(comment.created_at)}</span>
              </div>
              <p className="text-sm text-stone-600 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
