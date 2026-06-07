'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { getCloudinaryUrl, formatDate } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

interface PostCardProps {
  post: any;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link 
      href={`/${post.slug}`}
      aria-label={`Read dossier: ${post.title}`}
      className="group block border-b border-stone-200 pb-8 pt-4 hover:bg-stone-100/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:rounded cursor-pointer"
      id={`post-card-${post.id}`}
    >
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
        {post.featured_image && (
          <div className="relative aspect-[4/3] w-full md:w-64 rounded bg-stone-200 shrink-0 overflow-hidden shadow-sm filter grayscale group-hover:grayscale-0 transition-all duration-500 border border-stone-300">
            <Image
              src={getCloudinaryUrl(post.featured_image)}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 256px"
              className="object-cover w-full h-full"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <div className="flex-1 flex flex-col justify-between h-full">
          <div>
            {/* Top row categories and date mapping */}
            <div className="flex items-center space-x-3 text-xs font-mono text-stone-500 mb-3 uppercase tracking-wider">
              <span>{formatDate(post.published_at)}</span>
              {post.category && (
                <>
                  <span className="text-stone-300">|</span>
                  <span className="font-semibold text-red-900 border-b border-red-200 pb-0.5">
                    {post.category.name}
                  </span>
                </>
              )}
            </div>

            {/* Post Headline Title */}
            <h3 className="font-display text-2xl md:text-3xl font-bold text-stone-900 group-hover:text-red-900 transition-colors mb-3 leading-tight tracking-tight">
              {post.title}
            </h3>

            {post.summary && (
              <p className="font-sans text-stone-600 text-base md:text-lg line-clamp-3 leading-relaxed">
                {post.summary}
              </p>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between text-xs pt-4 border-t border-stone-200/50">
            <span className="text-stone-400 font-mono">
              CASE FILE: #{post.id.substring(0, 6).toUpperCase()}
            </span>
            <span className="inline-flex items-center text-xs font-bold font-mono uppercase tracking-widest text-stone-800 group-hover:text-red-800 transition-colors">
              Open File
              <BookOpen className="h-3.5 w-3.5 ml-2" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
