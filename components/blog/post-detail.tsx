'use client';

import React from 'react';
import { ArrowLeft, Feather, Calendar } from 'lucide-react';
import { getCloudinaryUrl, formatDate } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import PostLikes from './post-likes';
import PostComments from './post-comments';

interface PostDetailProps {
  post: any;
  authorName?: string;
  authorSlug?: string;
  onBack?: () => void;
  onSelectTag?: (tagSlug: string) => void;
}

export default function PostDetail({ post, authorName = 'Amy97', authorSlug = 'amy97', onBack, onSelectTag }: PostDetailProps) {
  return (
    <article className="max-w-3xl mx-auto animate-fade-in" id={`post-detail-${post.id}`}>
      {/* Back Nav Link */}
      {onBack ? (
        <button
          onClick={onBack}
          className="inline-flex items-center text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 text-xs font-mono uppercase tracking-widest mb-10 transition-colors cursor-pointer group"
          id="btn-back-to-list"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to All Posts
        </button>
      ) : (
        <Link
          href="/"
          className="inline-flex items-center text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 text-xs font-mono uppercase tracking-widest mb-10 transition-colors cursor-pointer group"
          id="btn-back-to-list"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to All Posts
        </Link>
      )}

      {/* Header Info */}
      <div className="border-b-4 border-stone-900 dark:border-stone-100 pb-8 mb-12">
        <div className="flex flex-wrap items-center text-xs text-stone-500 dark:text-stone-400 gap-x-4 gap-y-2 mb-6 font-mono uppercase tracking-widest">
          <span className="flex items-center font-bold text-stone-800 dark:text-stone-200">
            <Feather className="h-3.5 w-3.5 mr-1.5" />
            <Link href={`/author/${authorSlug}`} className="hover:text-red-900 dark:hover:text-red-400 transition-colors">
              {authorName}
            </Link>
          </span>
          <span className="text-stone-300 dark:text-stone-600">|</span>
          <span className="flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            {formatDate(post.published_at)}
          </span>
          {post.category && (
            <>
              <span className="text-stone-300 dark:text-stone-600">|</span>
              <span className="text-red-900 dark:text-red-400 font-bold border-b border-red-200 dark:border-red-800 pb-0.5">
                {post.category.name}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-stone-900 dark:text-stone-100 leading-none mb-6">
          {post.title}
        </h1>

        {/* Standout Summary */}
        {post.summary && (
          <p className="text-xl text-stone-600 dark:text-stone-400 font-sans leading-relaxed italic border-l-2 border-stone-300 dark:border-stone-600 pl-4">
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
            className="object-cover w-full h-full border border-stone-200 dark:border-stone-700 rounded"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Content markup parsing */}
      <div 
        className="post-content prose prose-stone prose-lg max-w-none overflow-hidden prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-a:text-red-900 dark:prose-a:text-red-400 prose-blockquote:border-l-4 prose-blockquote:border-stone-900 dark:prose-blockquote:border-stone-600 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:font-serif prose-blockquote:text-stone-600 dark:prose-blockquote:text-stone-400 text-stone-800 dark:text-stone-300 leading-relaxed font-sans"
        dangerouslySetInnerHTML={{ __html: post.content }}
        id="post-html-content"
      />

      {/* Footer level mapping of tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="mt-16 pt-8 border-t-2 border-stone-200 dark:border-stone-700" id="post-detail-tags" aria-label="Tags">
          <span className="block text-xs font-mono text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-4">Tags</span>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((t: any) => (
              <span
                key={t.id}
                className="inline-flex items-center px-3 py-1 border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 text-xs font-mono uppercase tracking-widest"
              >
                {t.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Likes and Comments */}
      <div className="mt-16 pt-8 border-t-2 border-stone-200 dark:border-stone-700 space-y-12">
        <PostLikes postId={post.id} />
        <PostComments postId={post.id} />
      </div>
    </article>
  );
}
