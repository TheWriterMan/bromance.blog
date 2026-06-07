'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, LogOut, Component } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import SidebarNav from './sidebar-nav';
import MobileDrawer from './mobile-drawer';

const SECTION_LABELS: Record<string, string> = {
  '/cms': 'Dashboard',
  '/cms/posts': 'Posts',
  '/cms/media': 'Media',
  '/cms/categories': 'Categories',
  '/cms/tags': 'Tags',
  '/cms/authors': 'Author',
  '/cms/settings': 'Settings',
};

export default function CmsShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();

  const currentSection = SECTION_LABELS[pathname] || 'CMS';

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    window.location.href = '/cms';
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      {!isMobile && (
        <SidebarNav
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <MobileDrawer
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-zinc-200 bg-white flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="p-2.5 -ml-1 rounded-md hover:bg-zinc-100 transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5 text-zinc-700" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Component className="h-4 w-4 text-zinc-500" />
              <span className="text-sm font-semibold text-zinc-900">{currentSection}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
            aria-label="Log out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
