import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getPublishedPosts, getAuthor, getSiteSettings, getCategories } from '@/lib/blog-data';
import PostCard from '@/components/blog/post-card';

export const revalidate = 300;

export default async function HomePage() {
  const [{ posts }, author, settings, categories] = await Promise.all([
    getPublishedPosts({ limit: 12 }),
    getAuthor(),
    getSiteSettings(),
    getCategories(),
  ]);

  const trending = posts.slice(0, 3);
  const feature = posts[3] ?? posts[0];
  const grid = posts.slice(4, 8).length > 0 ? posts.slice(4, 8) : posts.slice(1, 5);
  const topCategory = categories[0];

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative w-full h-[65vh] min-h-[400px] mb-8 overflow-hidden border-b border-[var(--color-primary)]/20">
        <img src="/hero-banner.jpg" alt="" className="absolute inset-0 w-full h-full object-cover brightness-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 flex flex-col items-center justify-center px-6 text-center">
          <span className="text-white text-xs tracking-widest font-black uppercase bg-[#cc0000] px-4 py-1.5 rounded mb-4 shadow-lg">
            Official Creator Hub
          </span>
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-white">{settings.siteName}</h2>
          <p className="text-gray-200 font-medium text-lg md:text-xl mt-4 max-w-2xl">{settings.tagline}</p>
          <Link
            href={topCategory ? `/category/${topCategory.slug}` : '/'}
            className="mt-8 px-8 py-3 bg-[#cc0000] text-white font-extrabold text-sm uppercase tracking-widest hover:bg-white hover:text-[#cc0000] transition-all duration-300 rounded shadow-md hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            Start Reading
          </Link>
        </div>
      </section>

      <div className="max-w-7xl mx-auto w-full px-6">
        {posts.length === 0 ? (
          <section className="py-24 text-center">
            <h2 className="text-3xl font-extrabold text-[var(--color-primary)]">No posts yet</h2>
            <p className="mt-3 opacity-70 text-[var(--color-primary)]">Check back soon for new content.</p>
          </section>
        ) : (
          <>
            {/* Trending */}
            {trending.length > 0 && (
              <section className="mb-8">
                <div className="flex justify-between items-end mb-4">
                  <h2 className="text-4xl font-extrabold text-[var(--color-primary)]">Trending Now</h2>
                </div>
                <hr className="border-[var(--color-primary)]/20 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {trending.map((post) => (
                    <PostCard key={post.id} post={post} variant="minimal" />
                  ))}
                </div>
              </section>
            )}

            {/* Novel promo section hidden for now */}

            {/* Latest editorial layout */}
            {feature && (
              <section className="mb-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-1">
                    <PostCard post={feature} authorName={author.displayName} variant="feature" />
                  </div>
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                    {grid.map((post) => (
                      <div key={post.id} className="flex flex-col">
                        <PostCard post={post} authorName={author.displayName} variant="grid" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-12 text-center">
                  {topCategory && (
                    <Link
                      href={`/category/${topCategory.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-primary)] hover:opacity-70 transition-opacity"
                    >
                      Browse all posts <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
