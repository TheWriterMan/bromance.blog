'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, FilePlus, Image, Eye } from 'lucide-react';
import CmsShell from '@/components/cms/layout/cms-shell';

interface DashboardStats {
  published: number;
  drafts: number;
  totalViews: number;
}

interface DraftPost {
  id: string;
  title: string;
  created_at: string;
}

export default function CmsDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ published: 0, drafts: 0, totalViews: 0 });
  const [recentDrafts, setRecentDrafts] = useState<DraftPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch('/api/posts?status=all');
        if (!res.ok) throw new Error('Failed to load posts');
        const data = await res.json();
        const posts = data.items || data;

        const published = posts.filter((p: any) => p.status === 'published').length;
        const drafts = posts.filter((p: any) => p.status === 'draft').length;
        const totalViews = posts.reduce((sum: number, p: any) => sum + (p.views || 0), 0);

        setStats({ published, drafts, totalViews });
        setRecentDrafts(
          posts
            .filter((p: any) => p.status === 'draft')
            .slice(0, 5)
            .map((p: any) => ({ id: p.id, title: p.title, created_at: p.created_at }))
        );
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <CmsShell>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Overview of your blog content.</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Published"
            value={loading ? '—' : String(stats.published)}
            icon={<FileText className="h-4 w-4 text-emerald-600" />}
          />
          <StatCard
            label="Drafts"
            value={loading ? '—' : String(stats.drafts)}
            icon={<FilePlus className="h-4 w-4 text-amber-600" />}
          />
          <StatCard
            label="Total Views"
            value={loading ? '—' : stats.totalViews.toLocaleString()}
            icon={<Eye className="h-4 w-4 text-blue-600" />}
          />
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/cms/posts"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors"
          >
            <FilePlus className="h-4 w-4" />
            New Post
          </Link>
          <Link
            href="/cms/media"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-md hover:bg-zinc-50 transition-colors"
          >
            <Image className="h-4 w-4" />
            Upload Media
          </Link>
        </div>

        {/* Recent drafts */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Recent Drafts</h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-zinc-100 rounded animate-pulse" />
              ))}
            </div>
          ) : recentDrafts.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4">No drafts yet.</p>
          ) : (
            <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-100 bg-white">
              {recentDrafts.map((draft) => (
                <Link
                  key={draft.id}
                  href={`/cms/posts/${draft.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors min-h-[44px]"
                >
                  <span className="text-sm text-zinc-900 truncate">{draft.title}</span>
                  <span className="text-xs text-zinc-400 shrink-0 ml-4">
                    {new Date(draft.created_at).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </CmsShell>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}
