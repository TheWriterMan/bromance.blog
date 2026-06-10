import type { CSSProperties } from 'react';
import { Toaster } from 'sonner';
import BlogHeader from '@/components/blog/blog-header';
import BlogFooter from '@/components/blog/blog-footer';
import KofiFloat from '@/components/blog/kofi-float';
import { getSiteSettings, getCategories } from '@/lib/blog-data';

// Public blog uses a fixed crimson-on-white theme (scoped via CSS vars below),
// independent of the CMS dark-mode toggle on the root <html>.
const themeVars = {
  '--color-primary': '#cc0000',
  '--color-bg': '#ffffff',
} as CSSProperties;

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSiteSettings(), getCategories()]);

  const navCategories = categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  return (
    <div
      style={themeVars}
      className="min-h-screen font-sans bg-[var(--color-bg)] text-[var(--color-primary)] overflow-x-hidden selection:bg-[var(--color-primary)] selection:text-[var(--color-bg)]"
    >
      <BlogHeader siteName={settings.siteName} kofiLink={settings.kofiLink} categories={navCategories} />
      <main className="min-h-[60vh]">{children}</main>
      <BlogFooter
        siteName={settings.siteName}
        description={settings.tagline}
        copyright={settings.copyright}
        kofiLink={settings.kofiLink}
        contactEmail={settings.contactEmail}
      />
      <KofiFloat kofiLink={settings.kofiLink} />
      <Toaster position="bottom-center" richColors />
    </div>
  );
}
