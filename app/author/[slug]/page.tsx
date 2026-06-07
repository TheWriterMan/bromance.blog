import { Metadata } from 'next';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { notFound } from 'next/navigation';
import Blog from '@/components/blog';
import Image from 'next/image';

// Default fallback if authors table doesn't exist or is empty
const DEFAULT_AUTHOR = {
  displayName: 'Amy97',
  slug: 'amy97',
  bio: '',
  avatarUrl: null as string | null,
};

async function getAuthor() {
  try {
    const rows = await db.select().from(schema.authors).limit(1);
    return rows[0] || DEFAULT_AUTHOR;
  } catch {
    return DEFAULT_AUTHOR;
  }
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const author = await getAuthor();

  if (params.slug !== author.slug) {
    return {};
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bromance.blog';

  return {
    title: `${author.displayName} - Author`,
    description: author.bio || `Posts by ${author.displayName}`,
    alternates: {
      canonical: `${baseUrl}/author/${author.slug}`,
    },
    openGraph: {
      title: `${author.displayName} - Author`,
      description: author.bio || `Posts by ${author.displayName}`,
      url: `${baseUrl}/author/${author.slug}`,
      type: 'profile',
      images: author.avatarUrl ? [{ url: author.avatarUrl }] : [],
    },
  };
}

export default async function AuthorPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const author = await getAuthor();

  if (params.slug !== author.slug) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.displayName,
    description: author.bio || '',
    image: author.avatarUrl || '',
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bromance.blog'}/author/${author.slug}`,
  };

  return (
    <div className="bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-5xl mx-auto px-6 py-16 flex items-center gap-6 border-b border-stone-200 dark:border-stone-800">
        <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 bg-stone-200 dark:bg-stone-800">
          {author.avatarUrl ? (
            <Image
              src={author.avatarUrl}
              alt={author.displayName}
              width={96}
              height={96}
              className="object-cover w-full h-full"
              referrerPolicy="no-referrer"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-500 dark:text-stone-400 text-3xl font-bold">
              {author.displayName[0]?.toUpperCase() || 'A'}
            </div>
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">{author.displayName}</h1>
          {author.bio && (
            <p className="text-stone-500 dark:text-stone-400 max-w-2xl text-sm leading-relaxed">{author.bio}</p>
          )}
        </div>
      </div>
      <Blog />
    </div>
  );
}
