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
