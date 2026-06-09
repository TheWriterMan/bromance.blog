'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Image,
  FolderOpen,
  Tag,
  MessageSquare,
  UserCircle,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

interface SidebarNavProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const NAV_ITEMS = [
  { href: '/cms', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cms/posts', label: 'Posts', icon: FileText },
  { href: '/cms/comments', label: 'Comments', icon: MessageSquare },
  { href: '/cms/media', label: 'Media', icon: Image },
  { href: '/cms/categories', label: 'Categories', icon: FolderOpen },
  { href: '/cms/tags', label: 'Tags', icon: Tag },
  { href: '/cms/authors', label: 'Author', icon: UserCircle },
  { href: '/cms/settings', label: 'Settings', icon: Settings },
];

export default function SidebarNav({ collapsed, onToggleCollapse }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`h-full border-r border-zinc-200 bg-white flex flex-col shrink-0 transition-[width] duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Brand */}
      <div className="h-14 flex items-center border-b border-zinc-200 px-4">
        {!collapsed && (
          <span className="font-display font-bold text-base text-zinc-900 tracking-tight truncate">
            CMS
          </span>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md transition-colors min-h-[44px] ${
                collapsed ? 'justify-center px-2' : 'px-3'
              } ${
                isActive
                  ? 'bg-zinc-100 text-zinc-900 font-medium'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
              title={collapsed ? label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="text-sm truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-zinc-200 p-2">
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-full min-h-[44px] rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeft className="h-[18px] w-[18px]" />
          ) : (
            <PanelLeftClose className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>
    </aside>
  );
}
