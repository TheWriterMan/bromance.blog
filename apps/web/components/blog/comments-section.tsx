'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || 'A').toUpperCase() + (parts[1]?.[0] || '').toUpperCase();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CommentsSection({
  postId,
  discussionOpen,
}: {
  postId: string;
  discussionOpen: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((d) => setComments(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName: name.trim() || undefined, content: content.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments((prev) => [data, ...prev]);
        setContent('');
        toast.success('Comment posted');
      } else {
        toast.error(data.error || 'Could not post comment');
      }
    } catch {
      toast.error('Could not post comment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div id="comments" className="mt-8 scroll-mt-28">
      <h3 className="text-2xl font-bold mb-8 text-[var(--color-primary)]">
        Comments ({comments.length})
      </h3>

      {discussionOpen ? (
        <form onSubmit={handleSubmit} className="mb-10">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            maxLength={80}
            className="w-full p-3 mb-3 border border-[var(--color-primary)]/30 bg-transparent outline-none placeholder:opacity-50 text-[var(--color-primary)] focus:border-[var(--color-primary)] transition-colors text-sm font-semibold"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Leave a friendly comment…"
            rows={3}
            maxLength={2000}
            required
            className="w-full p-4 border border-[var(--color-primary)]/30 bg-transparent outline-none placeholder:opacity-50 text-[var(--color-primary)] focus:border-[var(--color-primary)] transition-colors"
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="px-6 py-2.5 bg-[#cc0000] text-white font-extrabold text-xs uppercase tracking-widest rounded hover:bg-red-800 transition-colors disabled:opacity-40 min-h-[44px] flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Post Comment
            </button>
          </div>
        </form>
      ) : (
        <p className="mb-10 p-4 border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 text-sm font-semibold text-[var(--color-primary)]/70 rounded">
          Comments are closed on this post.
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]/50" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-[var(--color-primary)]/60 font-semibold py-4">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] shrink-0 flex items-center justify-center text-[var(--color-bg)] font-bold text-sm">
                {initials(c.author_name)}
              </div>
              <div className="p-4 border border-[var(--color-primary)]/10 bg-[var(--color-primary)]/5 w-full rounded-sm">
                <p className="font-bold text-sm text-[var(--color-primary)]">
                  {c.author_name}
                  <span className="opacity-50 font-normal ml-2 text-xs">{timeAgo(c.created_at)}</span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-primary)] whitespace-pre-line">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
