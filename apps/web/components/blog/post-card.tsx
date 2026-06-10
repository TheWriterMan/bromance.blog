import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getCloudinaryUrl, formatDate } from '@/lib/utils';
import type { BlogPost } from '@/lib/blog-data';

type Variant = 'grid' | 'feature' | 'list' | 'minimal';

interface PostCardProps {
  post: BlogPost;
  authorName?: string;
  variant?: Variant;
}

export default function PostCard({ post, authorName, variant = 'grid' }: PostCardProps) {
  const href = `/${post.slug}`;
  const img = getCloudinaryUrl(post.featuredImage, 'featured');

  if (variant === 'feature') {
    return (
      <Link href={href} className="flex flex-col group">
        <div className="overflow-hidden aspect-video w-full mb-6 bg-[var(--color-primary)]/5">
          <img src={img} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
        </div>
        <h3 className="text-3xl font-extrabold leading-tight mb-3 decoration-2 underline-offset-4 group-hover:underline text-[var(--color-primary)]">
          {post.title}
        </h3>
        <p className="text-sm font-semibold opacity-70 mb-4 uppercase tracking-wide flex items-center gap-2 text-[var(--color-primary)]">
          {authorName}
          <span className="w-1 h-1 rounded-full bg-current" />
          {formatDate(post.publishedAt)}
        </p>
        <p className="text-base leading-relaxed text-[var(--color-primary)] opacity-90 line-clamp-3">{post.summary}</p>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-primary)] group-hover:opacity-70 transition-opacity">
          Read more <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </span>
      </Link>
    );
  }

  if (variant === 'list') {
    return (
      <Link href={href} className="flex gap-4 items-start group">
        <div className="w-24 h-24 shrink-0 overflow-hidden bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10">
          <img src={getCloudinaryUrl(post.featuredImage, 'thumbnail')} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]" />
        </div>
        <div className="flex flex-col justify-center py-1">
          <h4 className="text-sm font-bold leading-snug decoration-2 underline-offset-4 group-hover:underline text-[var(--color-primary)] line-clamp-2">
            {post.title}
          </h4>
          <p className="text-xs mt-2 opacity-75 font-semibold uppercase text-[var(--color-primary)]">{post.readTime} min read</p>
        </div>
      </Link>
    );
  }

  if (variant === 'minimal') {
    return (
      <Link href={href} className="group flex flex-col gap-3">
        <div className="overflow-hidden aspect-[4/3] w-full bg-[var(--color-primary)]/5">
          <img src={img} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
        </div>
        <h3 className="text-xl font-bold leading-tight mt-2 decoration-2 underline-offset-4 group-hover:underline text-[var(--color-primary)]">{post.title}</h3>
        <p className="text-xs font-semibold opacity-70 text-[var(--color-primary)]">{post.readTime} min read</p>
      </Link>
    );
  }

  // grid (default)
  return (
    <Link href={href} className="flex flex-col group">
      <div className="overflow-hidden aspect-[4/3] w-full mb-4 bg-[var(--color-primary)]/5">
        <img src={img} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
      </div>
      <h4 className="text-xl font-bold leading-tight mb-2 decoration-2 underline-offset-4 group-hover:underline text-[var(--color-primary)]">
        {post.title}
      </h4>
      <p className="text-xs font-semibold opacity-70 mb-3 uppercase tracking-wide text-[var(--color-primary)]">
        {authorName ? `${authorName} • ` : ''}{post.readTime} min read
      </p>
      <p className="text-sm opacity-90 line-clamp-3 leading-relaxed text-[var(--color-primary)]">{post.summary}</p>
    </Link>
  );
}
