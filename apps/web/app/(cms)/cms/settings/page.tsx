'use client';

import Link from 'next/link';
import CmsShell from '@/components/cms/layout/cms-shell';
import { Database, ChevronRight } from 'lucide-react';

export default function CmsSettingsPage() {
  return (
    <CmsShell>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">Site configuration and preferences.</p>
        </div>
        <div className="space-y-2">
          <Link
            href="/cms/settings/backups"
            className="flex items-center justify-between border border-zinc-200 rounded-lg bg-white p-4 hover:bg-zinc-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-zinc-400 group-hover:text-zinc-600" />
              <div>
                <p className="text-sm font-medium text-zinc-900">Backups</p>
                <p className="text-xs text-zinc-500">Database backups, restore, and retention settings.</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600" />
          </Link>
        </div>
      </div>
    </CmsShell>
  );
}
