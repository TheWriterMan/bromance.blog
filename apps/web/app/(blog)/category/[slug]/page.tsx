import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getPublishedPosts, getAuthor } from '@/lib/blog-data';
import Breadcrumbs from '@/components/blog/breadcrumbs';
import PostCard from '@/components/blog/post-card';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: 'Category not found' };
  return {
    title: category.name,
    description: category.description || `Posts in ${category.name}`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [{ posts }, author] = await Promise.all([
    getPublishedPosts({ categoryId: category.id, limit: 48 }),
    getAuthor(),
  ]);

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: category.name }]} />

      <div className="mb-12 border-b border-[var(--color-primary)]/10 pb-8">
        <p className="text-sm font-bold tracking-widest uppercase mb-4 text-[var(--color-primary)]">Category</p>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-[var(--color-primary)]">{category.name}</h1>
        {category.description && (
          <p className="text-lg mt-6 opacity-80 max-w-2xl text-[var(--color-primary)]">{category.description}</p>
        )}
        <p className="text-xs font-bold uppercase tracking-widest opacity-50 mt-4 text-[var(--color-primary)]">
          {category.postCount} {category.postCount === 1 ? 'post' : 'posts'}
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="py-16 text-center font-semibold text-[var(--color-primary)]/60">No posts in this category yet.</p>
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
