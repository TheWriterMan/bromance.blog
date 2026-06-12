'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/cms/page-header';
import { DESIGN } from '@/lib/design';
import { Trash2 } from 'lucide-react';

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  post_title?: string;
  post_id?: string;
}

export default function CmsCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, []);

  async function loadComments() {
    setLoading(true);
    try {
      // Get all posts first, then get comments for each
      const postsRes = await fetch('/api/posts?status=all&limit=100&excludeContent=true');
      if (!postsRes.ok) throw new Error('Failed to load posts');
      const postsData = await postsRes.json();
      const posts = postsData.items || postsData;

      const allComments: Comment[] = [];
      // Fetch comments for each post in parallel (batch of 10)
      const batches = [];
      for (let i = 0; i < posts.length; i += 10) {
        batches.push(posts.slice(i, i + 10));
      }

      for (const batch of batches) {
        const results = await Promise.all(
          batch.map(async (post: any) => {
            try {
              const res = await fetch(`/api/posts/${post.id}/comments`);
              if (!res.ok) return [];
              const data = await res.json();
              if (!Array.isArray(data)) return [];
              return data.map((c: any) => ({
                ...c,
                post_title: post.title,
                post_id: post.id,
              }));
            } catch {
              return [];
            }
          })
        );
        results.forEach(r => allComments.push(...r));
      }

      // Sort by date descending
      allComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setComments(allComments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteComment(postId: string, commentId: string) {
    if (!confirm('Delete this comment?')) return;
    setDeleting(commentId);
    try {
      const res = await fetch(`/api/posts/${postId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch {
    } finally {
      setDeleting(null);
    }
  }

  function formatDate(str: string) {
    return new Date(str).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Comments"
        description={`${comments.length} comment${comments.length !== 1 ? 's' : ''} across all posts.`}
      />

      <main className="flex-1 p-4 md:p-6 space-y-4">

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse border border-zinc-200 rounded-lg bg-white p-4">
                <div className="h-4 bg-zinc-200 w-1/3 rounded mb-2" />
                <div className="h-3 bg-zinc-100 w-2/3 rounded" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="border border-zinc-200 rounded-lg bg-white p-12 text-center">
            <p className="text-zinc-400 text-sm">No comments yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {comments.map(comment => (
              <div key={comment.id} className="border border-zinc-200 rounded-lg bg-white p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-zinc-900">{comment.author_name}</span>
                    <span className="text-xs text-zinc-400">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap break-words">{comment.content}</p>
                  {comment.post_title && (
                    <p className="text-xs text-zinc-400 mt-2">
                      on <span className="font-medium text-zinc-600">{comment.post_title}</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteComment(comment.post_id!, comment.id)}
                  disabled={deleting === comment.id}
                  className={DESIGN.dangerButton}
                  aria-label="Delete comment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
