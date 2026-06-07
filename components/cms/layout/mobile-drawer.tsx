'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Image,
  FolderOpen,
  Tag,
  Settings,
  X,
} from 'lucide-react';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { href: '/cms', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cms/posts', label: 'Posts', icon: FileText },
  { href: '/cms/media', label: 'Media', icon: Image },
  { href: '/cms/categories', label: 'Categories', icon: FolderOpen },
  { href: '/cms/tags', label: 'Tags', icon: Tag },
  { href: '/cms/settings', label: 'Settings', icon: Settings },
];

export default function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 flex flex-col shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-200">
          <span className="font-display font-bold text-base text-zinc-900 tracking-tight">
            CMS
          </span>
          <button
            onClick={onClose}
            className="p-2.5 rounded-md hover:bg-zinc-100 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5 text-zinc-700" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 rounded-md transition-colors min-h-[44px] ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-900 font-medium'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="text-sm">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
