import type { Metadata } from 'next';
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bromance.blog'),
  title: {
    default: 'Bromance — Donghua, Drama, Manga & Novel Reviews',
    template: '%s | Bromance Blog',
  },
  description: 'Your go-to hub for donghua, Chinese drama, manga, and novel reviews, recaps, rankings, and recommendations. Written by Amy97.',
  keywords: ['Donghua', 'Chinese Animation', 'Drama', 'Manga', 'Novel', 'Reviews', 'Recommendations', 'Recaps', 'Rankings', 'BL', 'Bromance'],
  authors: [{ name: 'Amy97', url: 'https://bromance.blog/author/amy97' }],
  creator: 'Amy97',
  publisher: 'Bromance Blog',
  alternates: {
    canonical: 'https://bromance.blog',
    types: {
      'application/rss+xml': 'https://bromance.blog/feed.xml',
    },
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Bromance — Donghua, Drama, Manga & Novel Reviews',
    description: 'Your go-to hub for donghua, Chinese drama, manga, and novel reviews, recaps, rankings, and recommendations.',
    type: 'website',
    url: 'https://bromance.blog',
    siteName: 'Bromance Blog',
    locale: 'en_US',
    images: [{ url: '/hero-banner.jpg', width: 1200, height: 630, alt: 'Bromance Blog — Donghua, Drama, Manga & Novel Reviews' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bromance — Donghua, Drama, Manga & Novel Reviews',
    description: 'Your go-to hub for donghua, Chinese drama, manga, and novel reviews, recaps, rankings, and recommendations.',
    images: ['/hero-banner.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('theme');
              if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className="bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans antialiased selection:bg-red-950 selection:text-white transition-colors duration-200" suppressHydrationWarning>
        {children}
        <Analytics />
        
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script defer data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN} src="https://plausible.io/js/script.js" />
        )}
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script async defer data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID} src={process.env.NEXT_PUBLIC_UMAMI_URL || "https://analytics.umami.is/script.js"} />
        )}
        <Script id="org-schema" type="application/ld+json" strategy="beforeInteractive">
          {`
            {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "name": "Bromance Blog",
                  "url": "${process.env.NEXT_PUBLIC_SITE_URL || 'https://bromance.blog'}",
                  "description": "Donghua, drama, manga, and novel reviews, recaps, rankings, and recommendations.",
                  "publisher": {
                    "@type": "Organization",
                    "name": "Bromance Blog",
                    "url": "${process.env.NEXT_PUBLIC_SITE_URL || 'https://bromance.blog'}",
                    "logo": {
                      "@type": "ImageObject",
                      "url": "${process.env.NEXT_PUBLIC_SITE_URL || 'https://bromance.blog'}/logo.png",
                      "width": 512,
                      "height": 512
                    }
                  },
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                      "@type": "EntryPoint",
                      "urlTemplate": "${process.env.NEXT_PUBLIC_SITE_URL || 'https://bromance.blog'}/?q={search_term_string}"
                    },
                    "query-input": "required name=search_term_string"
                  }
                },
                {
                  "@type": "Person",
                  "name": "Amy97",
                  "url": "${process.env.NEXT_PUBLIC_SITE_URL || 'https://bromance.blog'}/author/amy97"
                }
              ]
            }
          `}
        </Script>
      </body>
    </html>
  );
}
