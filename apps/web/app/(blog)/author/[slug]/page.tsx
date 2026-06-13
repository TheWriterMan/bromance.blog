import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAuthorBySlug, getPublishedPosts } from '@/lib/blog-data';
import { getCloudinaryUrl } from '@/lib/utils';
import Breadcrumbs from '@/components/blog/breadcrumbs';
import PostCard from '@/components/blog/post-card';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return { title: 'Author not found' };
  return {
    title: `${author.displayName} — Author`,
    description: author.bio || `Articles and reviews by ${author.displayName} on Bromance Blog.`,
    openGraph: {
      title: `${author.displayName} — Author | Bromance Blog`,
      description: author.bio || `Articles and reviews by ${author.displayName} on Bromance Blog.`,
      type: 'profile',
      url: `https://bromance.blog/author/${slug}`,
    },
    alternates: {
      canonical: `https://bromance.blog/author/${slug}`,
    },
  };
}

export default async function AuthorPage({ params }: PageProps) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  // Single-author blog: all published posts are authored here.
  const { posts } = await getPublishedPosts({ limit: 48 });

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: author.displayName }]} />

      <div className="mb-12 border-b border-[var(--color-primary)]/10 pb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {author.avatarUrl ? (
          <img
            src={getCloudinaryUrl(author.avatarUrl, 'thumbnail')}
            alt={author.displayName}
            className="w-24 h-24 rounded-full object-cover border border-[var(--color-primary)]/20"
          />
        ) : (
          <span className="w-24 h-24 rounded-full bg-[var(--color-primary)] text-[var(--color-bg)] flex items-center justify-center text-3xl font-black">
            {author.displayName[0]}
          </span>
        )}
        <div>
          <p className="text-sm font-bold tracking-widest uppercase mb-2 text-[var(--color-primary)]">Author</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[var(--color-primary)]">{author.displayName}</h1>
          {author.bio && <p className="text-base mt-4 opacity-80 max-w-2xl text-[var(--color-primary)]">{author.bio}</p>}
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="py-16 text-center font-semibold text-[var(--color-primary)]/60">No posts yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} authorName={author.displayName} variant="grid" />
          ))}
        </div>
      )}
    </div>
  );
}
