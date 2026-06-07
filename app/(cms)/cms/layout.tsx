import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Journal Desk — Bromance CMS',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans antialiased">
      {children}
    </div>
  );
}
