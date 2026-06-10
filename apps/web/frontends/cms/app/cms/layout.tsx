import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { CmsSidebar } from '@/components/cms/cms-sidebar'

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <CmsSidebar />
      <SidebarInset className="min-h-screen">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
