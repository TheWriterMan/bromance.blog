import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTagBySlug, getPublishedPosts, getAuthor } from '@/lib/blog-data';
import Breadcrumbs from '@/components/blog/breadcrumbs';
import PostCard from '@/components/blog/post-card';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return { title: 'Tag not found' };
  return {
    title: `#${tag.name} — Tagged Posts`,
    description: `Browse all articles tagged with ${tag.name} on Bromance Blog.`,
    openGraph: {
      title: `#${tag.name} — Tagged Posts | Bromance Blog`,
      description: `Browse all articles tagged with ${tag.name} on Bromance Blog.`,
      type: 'website',
      url: `https://bromance.blog/tag/${slug}`,
    },
    alternates: {
      canonical: `https://bromance.blog/tag/${slug}`,
    },
  };
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const [{ posts, total }, author] = await Promise.all([
    getPublishedPosts({ tagSlug: tag.slug, limit: 48 }),
    getAuthor(),
  ]);

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: `#${tag.name}` }]} />

      <div className="mb-12 border-b border-[var(--color-primary)]/10 pb-8">
        <p className="text-sm font-bold tracking-widest uppercase mb-4 text-[var(--color-primary)]">Tag</p>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-[var(--color-primary)]">#{tag.name}</h1>
        <p className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4 text-[var(--color-primary)]">
          {total} {total === 1 ? 'post' : 'posts'}
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="py-16 text-center font-semibold text-[var(--color-primary)]/60">No posts with this tag yet.</p>
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
