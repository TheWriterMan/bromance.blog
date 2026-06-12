import type { Metadata } from 'next';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { CmsSidebar } from '@/components/cms/cms-sidebar';

export const metadata: Metadata = {
  title: 'CMS — Bromance',
  robots: {
    index: false,
    follow: false,
  },
};

// The CMS is fully auth-gated and never statically cached. Forcing the whole
// segment dynamic prevents static-prerender bailouts from client hooks like
// useSearchParams() (used in the sidebar + several CMS pages).
export const dynamic = 'force-dynamic';

export default function CmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <CmsSidebar />
      <SidebarInset className="min-h-screen">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
