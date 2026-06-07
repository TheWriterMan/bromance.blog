'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Feather, Calendar } from 'lucide-react';
import { getCloudinaryUrl, formatDate } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import PostLikes from './post-likes';
import PostComments from './post-comments';

interface PostDetailProps {
  post: any;
  onBack?: () => void;
  onSelectTag?: (tagSlug: string) => void;
}

export default function PostDetail({ post, onBack, onSelectTag }: PostDetailProps) {
  const [authorName, setAuthorName] = useState('Amy97');
  const [authorSlug, setAuthorSlug] = useState('amy97');

  useEffect(() => {
    async function fetchAuthor() {
      try {
        const res = await fetch('/api/authors');
        if (res.ok) {
          const data = await res.json();
          if (data.display_name) setAuthorName(data.display_name);
          if (data.slug) setAuthorSlug(data.slug);
        }
      } catch {}
    }
    fetchAuthor();
  }, []);
  return (
    <article className="max-w-3xl mx-auto animate-fade-in" id={`post-detail-${post.id}`}>
      {/* Back Nav Link */}
      {onBack ? (
        <button
          onClick={onBack}
          className="inline-flex items-center text-stone-500 hover:text-stone-900 text-xs font-mono uppercase tracking-widest mb-10 transition-colors cursor-pointer group"
          id="btn-back-to-list"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to All Posts
        </button>
      ) : (
        <Link
          href="/"
          className="inline-flex items-center text-stone-500 hover:text-stone-900 text-xs font-mono uppercase tracking-widest mb-10 transition-colors cursor-pointer group"
          id="btn-back-to-list"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to All Posts
        </Link>
      )}

      {/* Header Info */}
      <div className="border-b-4 border-stone-900 pb-8 mb-12">
        <div className="flex flex-wrap items-center text-xs text-stone-500 gap-x-4 gap-y-2 mb-6 font-mono uppercase tracking-widest">
          <span className="flex items-center font-bold text-stone-800">
            <Feather className="h-3.5 w-3.5 mr-1.5" />
            <Link href={`/author/${authorSlug}`} className="hover:text-red-900 transition-colors">
              {authorName}
            </Link>
          </span>
          <span className="text-stone-300">|</span>
          <span className="flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            {formatDate(post.published_at)}
          </span>
          {post.category && (
            <>
              <span className="text-stone-300">|</span>
              <span className="text-red-900 font-bold border-b border-red-200 pb-0.5">
                {post.category.name}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-stone-900 leading-none mb-6">
          {post.title}
        </h1>

        {/* Standout Summary */}
        {post.summary && (
          <p className="text-xl text-stone-600 font-sans leading-relaxed italic border-l-2 border-stone-300 pl-4">
            {post.summary}
          </p>
        )}
      </div>

      {/* Post Featured Cover Block - Clean */}
      {post.featured_image && (
        <div className="relative aspect-[21/9] w-full mb-12" id="post-featured-image">
          <Image
            src={getCloudinaryUrl(post.featured_image)}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover w-full h-full border border-stone-200"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Content markup parsing */}
      <div 
        className="post-content prose prose-stone prose-lg max-w-none overflow-hidden prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-a:text-red-900 prose-blockquote:border-l-4 prose-blockquote:border-stone-900 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:font-serif prose-blockquote:text-stone-600 text-stone-800 leading-relaxed font-sans"
        dangerouslySetInnerHTML={{ __html: post.content }}
        id="post-html-content"
      />

      {/* Footer level mapping of tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-16 pt-8 border-t-2 border-stone-200" id="post-detail-tags" aria-label="Tags">
          <span className="block text-xs font-mono text-stone-500 uppercase tracking-widest mb-4">Tags</span>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((t: any) => (
              <span
                key={t.id}
                className="inline-flex items-center px-3 py-1 border border-stone-300 text-stone-600 text-xs font-mono uppercase tracking-widest"
              >
                {t.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Likes and Comments */}
      <div className="mt-16 pt-8 border-t-2 border-stone-200 space-y-12">
        <PostLikes postId={post.id} />
        <PostComments postId={post.id} />
      </div>
    </article>
  );
}
