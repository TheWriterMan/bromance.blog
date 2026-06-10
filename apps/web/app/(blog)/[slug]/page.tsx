import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Coffee } from 'lucide-react';
import {
  getPostBySlug,
  getRelatedPosts,
  getCategories,
  getAuthor,
  getSiteSettings,
} from '@/lib/blog-data';
import { renderPostContent } from '@/lib/tiptap-html';
import { getCloudinaryUrl, formatDate } from '@/lib/utils';
import Breadcrumbs from '@/components/blog/breadcrumbs';
import PostCard from '@/components/blog/post-card';
import PostInteractions from '@/components/blog/post-interactions';
import CommentsSection from '@/components/blog/comments-section';
import ViewCounter from '@/components/blog/view-counter';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post not found' };

  const ogImg = post.ogImage || post.featuredImage;
  const images = ogImg ? [getCloudinaryUrl(ogImg, 'featured')] : undefined;

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.summary,
    alternates: post.canonicalUrl ? { canonical: post.canonicalUrl } : undefined,
    robots: post.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.summary,
      type: 'article',
      publishedTime: post.publishedAt || undefined,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.summary,
      images,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [related, categories, author, settings] = await Promise.all([
    getRelatedPosts(post, 3),
    getCategories(),
    getAuthor(),
    getSiteSettings(),
  ]);

  const html = renderPostContent(post.content);
  const sidebarCategories = categories.slice(0, 5);

  return (
    <article className="max-w-7xl mx-auto w-full px-6 overflow-hidden">
      <ViewCounter postId={post.id} />

      <div className="mt-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            ...(post.category ? [{ label: post.category.name, href: `/category/${post.category.slug}` }] : []),
            { label: post.title },
          ]}
        />
      </div>

      <header className="text-center my-12 max-w-4xl mx-auto">
        {post.category && (
          <Link
            href={`/category/${post.category.slug}`}
            className="text-sm font-bold tracking-widest uppercase mb-4 inline-block text-[var(--color-primary)] hover:underline transition-all"
          >
            {post.category.name}
          </Link>
        )}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 text-[var(--color-primary)]">
          {post.title}
        </h1>
        <div className="flex items-center justify-center gap-4">
          <Link href={`/author/${author.slug}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            {author.avatarUrl ? (
              <img
                src={getCloudinaryUrl(author.avatarUrl, 'thumbnail')}
                alt={author.displayName}
                className="w-12 h-12 rounded-full object-cover border border-[var(--color-primary)]/20"
              />
            ) : (
              <span className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-[var(--color-bg)] flex items-center justify-center font-bold">
                {author.displayName[0]}
              </span>
            )}
            <div className="text-left">
              <p className="text-sm font-bold text-[var(--color-primary)]">{author.displayName}</p>
              <p className="text-xs opacity-70 font-semibold uppercase tracking-wide flex items-center gap-2 text-[var(--color-primary)]">
                {formatDate(post.publishedAt)}
                <span className="w-1 h-1 rounded-full bg-current" />
                {post.readTime} min read
              </p>
            </div>
          </Link>
        </div>
      </header>

      <div className="lg:flex lg:gap-16 relative">
        <div className="lg:w-2/3">
          {post.featuredImage && (
            <div className="overflow-hidden mb-12 border border-[var(--color-primary)]/10">
              <img
                src={getCloudinaryUrl(post.featuredImage, 'featured')}
                alt={post.title}
                className="w-full aspect-video object-cover"
              />
            </div>
          )}

          <div
            className="prose prose-lg max-w-none text-[var(--color-primary)] prose-headings:text-[var(--color-primary)] prose-p:text-[var(--color-primary)] prose-strong:text-[var(--color-primary)] prose-a:text-[var(--color-primary)]"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {settings.kofiLink && (
            <div className="my-16 p-8 border border-[var(--color-primary)]/20 flex flex-col sm:flex-row items-center gap-6 justify-between bg-[var(--color-primary)]/5">
              <div>
                <h3 className="text-2xl font-black mb-2 text-[var(--color-primary)]">Enjoying the content?</h3>
                <p className="text-sm font-medium opacity-80 text-[var(--color-primary)]">
                  Support {author.displayName} by buying a coffee.
                </p>
              </div>
              <a
                href={settings.kofiLink}
                target="_blank"
                rel="noreferrer"
                className="whitespace-nowrap flex items-center gap-2 px-6 py-3 font-bold text-lg border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] transition-colors duration-300"
              >
                <Coffee className="w-5 h-5" /> Support
              </a>
            </div>
          )}

          <PostInteractions
            postId={post.id}
            slug={post.slug}
            title={post.title}
            initialLikes={0}
            commentCount={0}
          />

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 my-8">
              {post.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tag/${tag.slug}`}
                  className="text-xs font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1.5 rounded-full hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          <CommentsSection postId={post.id} discussionOpen={post.discussionOpen} />
        </div>

        <aside className="lg:w-1/3 mt-16 lg:mt-0">
          <div className="lg:sticky lg:top-28">
            {sidebarCategories.length > 0 && (
              <>
                <h3 className="text-sm font-bold tracking-widest uppercase mb-6 text-[var(--color-primary)]">Categories</h3>
                <ul className="flex flex-col gap-3">
                  {sidebarCategories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/category/${cat.slug}`}
                        className="flex justify-between items-center p-3 hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] transition-colors duration-200 group text-[var(--color-primary)]"
                      >
                        <span className="font-semibold">{cat.name}</span>
                        <span className="text-xs font-bold bg-[var(--color-primary)]/10 px-2 py-1 rounded-full group-hover:bg-[var(--color-bg)]/20">
                          {cat.postCount}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {related.length > 0 && (
              <>
                <hr className="border-[var(--color-primary)]/10 my-8" />
                <h3 className="text-sm font-bold tracking-widest uppercase mb-6 text-[var(--color-primary)]">Related</h3>
                <div className="flex flex-col gap-6">
                  {related.map((rp) => (
                    <PostCard key={rp.id} post={rp} variant="list" />
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
