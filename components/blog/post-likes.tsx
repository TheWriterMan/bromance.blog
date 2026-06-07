'use client';

import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface PostLikesProps {
  postId: string;
}

export default function PostLikes({ postId }: PostLikesProps) {
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchLikes() {
      try {
        const res = await fetch(`/api/posts/${postId}/likes`);
        if (res.ok) {
          const data = await res.json();
          setCount(data.count);
          setLiked(data.liked);
        }
      } catch {}
    }
    fetchLikes();
  }, [postId]);

  async function handleLike() {
    if (liked || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/likes`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCount(data.count);
        setLiked(true);
      } else if (res.status === 409) {
        setLiked(true);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={liked || loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
        liked
          ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 cursor-default'
          : 'border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:border-red-300 dark:hover:border-red-700 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer'
      }`}
      aria-label={liked ? 'Liked' : 'Like this post'}
    >
      <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
      <span>{count}</span>
    </button>
  );
}
