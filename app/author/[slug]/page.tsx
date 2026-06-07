import { Metadata } from 'next';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Blog from '@/components/blog';
import Image from 'next/image';

const AUTHOR_INFO = {
  name: 'Author Name',
  slug: 'author',
  bio: 'Lead author and editor of the Clean Blog Publishing system. Focused on producing high-quality written content about modern web publishing, CMS architecture, and user experience.',
  avatar: 'https://picsum.photos/seed/author/150/150',
  social: 'https://twitter.com/author'
};

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;

  if (params.slug !== AUTHOR_INFO.slug) {
    return {};
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return {
    title: `${AUTHOR_INFO.name} - Author`,
    description: AUTHOR_INFO.bio,
    alternates: {
      canonical: `${baseUrl}/author/${AUTHOR_INFO.slug}`,
    },
    openGraph: {
      title: `${AUTHOR_INFO.name} - Author`,
      description: AUTHOR_INFO.bio,
      url: `${baseUrl}/author/${AUTHOR_INFO.slug}`,
      type: 'profile',
      images: [{ url: AUTHOR_INFO.avatar }]
    },
  };
}

export default async function AuthorPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;

  if (params.slug !== AUTHOR_INFO.slug) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: AUTHOR_INFO.name,
    description: AUTHOR_INFO.bio,
    image: AUTHOR_INFO.avatar,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/author/${AUTHOR_INFO.slug}`,
    sameAs: [AUTHOR_INFO.social]
  };

  return (
    <div className="bg-white text-zinc-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-5xl mx-auto px-6 py-16 flex items-center gap-6 border-b border-zinc-100">
        <div className="w-24 h-24 rounded-full overflow-hidden mb-4 shrink-0">
          <Image src={AUTHOR_INFO.avatar} alt={AUTHOR_INFO.name} width={96} height={96} className="object-cover" referrerPolicy="no-referrer" />
        </div>
        <div>
          <h1 className="font-sans text-3xl font-bold text-zinc-900 mb-2">{AUTHOR_INFO.name}</h1>
          <p className="text-zinc-500 max-w-2xl text-sm leading-relaxed mb-4">{AUTHOR_INFO.bio}</p>
          <a href={AUTHOR_INFO.social} className="text-xs font-semibold text-zinc-600 hover:text-black">@author</a>
        </div>
      </div>
      <Blog />
    </div>
  );
}
