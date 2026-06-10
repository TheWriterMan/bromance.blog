'use client';

import { useEffect } from 'react';

/**
 * Fires a single view-increment per browser session per post.
 * Uses the existing GET /api/posts/[id]?inc_view=true endpoint.
 */
export default function ViewCounter({ postId }: { postId: string }) {
  useEffect(() => {
    if (!postId) return;
    const key = `viewed:${postId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* sessionStorage unavailable — still count once per mount */
    }
    fetch(`/api/posts/${postId}?inc_view=true`).catch(() => {});
  }, [postId]);

  return null;
}
