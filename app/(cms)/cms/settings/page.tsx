'use client';

import CmsShell from '@/components/cms/layout/cms-shell';

export default function CmsSettingsPage() {
  return (
    <CmsShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">Site configuration and preferences.</p>
        </div>
        <div className="border border-zinc-200 rounded-lg bg-white p-8 text-center">
          <p className="text-zinc-400 text-sm">Settings panel coming soon.</p>
        </div>
      </div>
    </CmsShell>
  );
}
