import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Toaster } from 'sonner';
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

export default async function CmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check for session cookie to determine if sidebar should render.
  // On the login page (/cms), the user won't have a valid session yet,
  // so the sidebar stays hidden until they authenticate.
  const cookieStore = await cookies();
  const hasSession = !!cookieStore.get('cms_session')?.value;

  if (!hasSession) {
    // No session — render children only (login form), no sidebar/chrome
    return (
      <>
        {children}
        <Toaster position="bottom-right" richColors />
      </>
    );
  }

  return (
    <SidebarProvider>
      <CmsSidebar />
      <SidebarInset className="min-h-screen">
        {children}
      </SidebarInset>
      <Toaster position="bottom-right" richColors />
    </SidebarProvider>
  );
}
