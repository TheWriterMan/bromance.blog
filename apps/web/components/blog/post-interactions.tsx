'use client';

import { useEffect, useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { toast } from 'sonner';

interface PostInteractionsProps {
  postId: string;
  slug: string;
  title: string;
  initialLikes: number;
  commentCount: number;
}

export default function PostInteractions({
  postId,
  slug,
  title,
  initialLikes,
  commentCount,
}: PostInteractionsProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState(commentCount);

  useEffect(() => {
    fetch(`/api/posts/${postId}/likes`)
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.count === 'number') setLikes(d.count);
        if (d.liked) setLiked(true);
      })
      .catch(() => {});
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setComments(d.length);
      })
      .catch(() => {});
    try {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      setSaved(bookmarks.includes(slug));
    } catch {
      /* ignore */
    }
  }, [postId, slug]);

  async function handleLike() {
    if (liked || pending) return; // backend is add-only; likes can't be undone
    setPending(true);
    setLiked(true);
    setLikes((n) => n + 1);
    try {
      const res = await fetch(`/api/posts/${postId}/likes`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && typeof data.count === 'number') {
        setLikes(data.count);
      } else if (res.status === 409) {
        // already liked previously from this browser
      } else if (!res.ok) {
        setLiked(false);
        setLikes((n) => Math.max(0, n - 1));
      }
    } catch {
      setLiked(false);
      setLikes((n) => Math.max(0, n - 1));
    } finally {
      setPending(false);
    }
  }

  async function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : `/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy link');
    }
  }

  function handleSave() {
    try {
      const bookmarks: string[] = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      let next: string[];
      if (bookmarks.includes(slug)) {
        next = bookmarks.filter((s) => s !== slug);
        setSaved(false);
        toast('Removed from saved');
      } else {
        next = [...bookmarks, slug];
        setSaved(true);
        toast.success('Saved for later');
      }
      localStorage.setItem('bookmarks', JSON.stringify(next));
    } catch {
      toast.error('Could not update saved posts');
    }
  }

  function scrollToComments() {
    document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
  }

  const btn = 'flex items-center gap-2 hover:opacity-70 transition-transform hover:scale-105 active:scale-95 text-[var(--color-primary)] min-h-[44px]';

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4 px-6 border-y border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 rounded-sm my-12">
      <div className="flex items-center gap-6">
        <button
          onClick={handleLike}
          disabled={pending}
          aria-label="Like this post"
          className={`${btn} ${liked ? 'opacity-100 font-black' : ''}`}
        >
          <Heart className={`w-5 h-5 transition-colors ${liked ? 'fill-[#cc0000] text-[#cc0000]' : ''}`} />
          <span className="font-bold text-sm">Like ({likes})</span>
        </button>
        <button onClick={scrollToComments} aria-label="Jump to comments" className={btn}>
          <MessageCircle className="w-5 h-5" />
          <span className="font-bold text-sm">Comment ({comments})</span>
        </button>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={handleShare} aria-label="Share this post" className={btn}>
          <Share2 className="w-5 h-5" />
          <span className="font-bold text-sm">Share</span>
        </button>
        <button onClick={handleSave} aria-label={saved ? 'Remove from saved' : 'Save for later'} className={btn}>
          <Bookmark className={`w-5 h-5 ${saved ? 'fill-[#cc0000] text-[#cc0000]' : ''}`} />
          <span className="font-bold text-sm hidden sm:inline">{saved ? 'Saved' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
}
