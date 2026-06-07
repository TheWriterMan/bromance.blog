'use client';

import React from 'react';
import PostDetail from '@/components/blog/post-detail';
import BlogHeader from '@/components/blog/blog-header';

export default function PostPageWrapper({ post }: { post: any }) {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col text-stone-900 font-sans selection:bg-red-950 selection:text-white">
      <BlogHeader onResetFilters={() => { window.location.href = '/'; }} />
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12">
        <PostDetail 
          post={post} 
          onBack={() => { window.location.href = '/'; }} 
          onSelectTag={(slug) => { window.location.href = `/?tag=${slug}`; }} 
        />
      </main>
      <footer className="border-t border-stone-200 bg-stone-900 py-12 mt-auto text-xs text-stone-400 font-mono tracking-widest text-center">
        <div className="max-w-6xl mx-auto px-6">
          <p>&copy; 2026 BROMANCE. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
}
