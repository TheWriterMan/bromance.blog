'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import PostFilters from './post-filters';
import PostRow from './post-row';
import StatusBadge from '@/components/cms/shared/status-badge';
import ConfirmDialog from '@/components/cms/shared/confirm-dialog';

type StatusTab = 'all' | 'published' | 'draft' | 'scheduled';
type SortField = 'title' | 'status' | 'category' | 'updated_at' | 'created_at';
type SortDir = 'asc' | 'desc';

interface Post {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'scheduled';
  created_at: string;
  updated_at: string;
  views: number;
  category?: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function PostList() {
  const router = useRouter();
  const isMobile = useIsMobile();

  // Data state
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Sort state
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Counts per status
  const [counts, setCounts] = useState({ all: 0, published: 0, draft: 0, scheduled: 0 });

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; title: string } | null>(null);

  const LIMIT = 20;

  // Fetch counts
  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts/counts');
      if (!res.ok) throw new Error('Failed to fetch counts');
      const data = await res.json();
      setCounts({
        all: data.all || 0,
        published: data.published || 0,
        draft: data.draft || 0,
        scheduled: data.scheduled || 0,
      });
    } catch (err) {
      console.error('Failed to fetch counts:', err);
    }
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('status', activeTab);
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      params.set('excludeContent', 'true');
      if (searchQuery) params.set('search', searchQuery);
      if (selectedCategory) params.set('category_id', selectedCategory);

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();

      setPosts(data.items || []);
      setTotal(data.metadata?.total || 0);
      setTotalPages(data.metadata?.totalPages || 1);
    } catch (err) {
      console.error('Post fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, searchQuery, selectedCategory]);

  // Fetch categories once
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);
    fetchCounts();
  }, [fetchCounts]);

  // Re-fetch posts when filters/page change
  useEffect(() => {
    fetchPosts();
    setSelectedIds(new Set());
  }, [fetchPosts]);

  // Client-side sorting (posts are already paginated from API)
  const sortedPosts = useMemo(() => {
    const sorted = [...posts];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'category':
          cmp = (a.category?.name || '').localeCompare(b.category?.name || '');
          break;
        case 'updated_at':
          cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [posts, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'title' || field === 'category' ? 'asc' : 'desc');
    }
  }

  // Reset page when filters change
  function handleTabChange(tab: StatusTab) {
    setActiveTab(tab);
    setPage(1);
  }
  function handleSearchChange(q: string) {
    setSearchQuery(q);
    setPage(1);
  }
  function handleCategoryChange(id: string | null) {
    setSelectedCategory(id);
    setPage(1);
  }

  // Selection
  function handleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }
  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(posts.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  // Delete flow
  function handleDeleteSingle(id: string) {
    const post = posts.find((p) => p.id === id);
    setDeleteTarget({ ids: [id], title: post?.title || 'this post' });
  }
  function handleDeleteBulk() {
    setDeleteTarget({
      ids: Array.from(selectedIds),
      title: `${selectedIds.size} post${selectedIds.size > 1 ? 's' : ''}`,
    });
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await Promise.all(
        deleteTarget.ids.map((id) =>
          fetch(`/api/posts/${id}`, { method: 'DELETE' })
        )
      );
      setDeleteTarget(null);
      setSelectedIds(new Set());
      fetchPosts();
      fetchCounts();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  // New post flow
  async function handleNewPost() {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Post', status: 'draft' }),
      });
      if (!res.ok) throw new Error('Failed to create draft');
      const data = await res.json();
      router.push(`/cms/posts/${data.id}`);
    } catch (err) {
      console.error('New post error:', err);
    }
  }

  // Bulk status change
  async function handleBulkStatusChange(newStatus: 'draft' | 'published') {
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/posts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          })
        )
      );
      setSelectedIds(new Set());
      fetchPosts();
      fetchCounts();
    } catch (err) {
      console.error('Bulk status change failed:', err);
    }
  }

  const allSelected = posts.length > 0 && selectedIds.size === posts.length;

  function SortHeader({ field, label, className }: { field: SortField; label: string; className?: string }) {
    const active = sortField === field;
    return (
      <th className={`px-3 py-3 ${className || ''}`}>
        <button
          onClick={() => handleSort(field)}
          className={`inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide transition-colors ${
            active ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          {label}
          {active ? (
            sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-40" />
          )}
        </button>
      </th>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Posts</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your blog content.</p>
        </div>
        {!isMobile && (
          <button
            onClick={handleNewPost}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            New Post
          </button>
        )}
      </div>

      {/* Filters */}
      <PostFilters
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        counts={counts}
      />

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-zinc-100 border border-zinc-200 rounded-md px-4 py-2.5">
          <span className="text-sm text-zinc-700 font-medium">
            {selectedIds.size} selected
          </span>
          <button
            onClick={handleDeleteBulk}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors min-h-[44px]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
          <button
            onClick={() => handleBulkStatusChange('published')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors min-h-[44px]"
          >
            Publish
          </button>
          <button
            onClick={() => handleBulkStatusChange('draft')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors min-h-[44px]"
          >
            Unpublish
          </button>
        </div>
      )}

      {/* Content area */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-zinc-100 rounded animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 border border-zinc-200 rounded-lg bg-white">
          <p className="text-zinc-500 text-sm mb-4">
            {searchQuery || selectedCategory
              ? 'No posts match your current filters.'
              : 'No posts yet.'}
          </p>
          <button
            onClick={handleNewPost}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create your first post
          </button>
        </div>
      ) : isMobile ? (
        /* Mobile card layout */
        <div className="space-y-3">
          {sortedPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => router.push(`/cms/posts/${post.id}`)}
              className="bg-white border border-zinc-200 rounded-lg p-4 active:bg-zinc-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-zinc-900 truncate">
                    {post.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {post.category?.name && <span className="text-zinc-600">{post.category.name} · </span>}
                    {new Date(post.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={post.status} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSingle(post.id);
                    }}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={`Delete ${post.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Desktop table */
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-50/80 border-b border-zinc-200">
              <tr>
                <th className="pl-4 pr-2 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 cursor-pointer"
                    aria-label="Select all posts"
                  />
                </th>
                <SortHeader field="title" label="Title" />
                <SortHeader field="category" label="Category" className="hidden lg:table-cell" />
                <SortHeader field="status" label="Status" />
                <SortHeader field="updated_at" label="Updated" className="hidden md:table-cell" />
                <SortHeader field="created_at" label="Created" className="hidden md:table-cell" />
                <th className="px-3 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPosts.map((post) => (
                <PostRow
                  key={post.id}
                  post={post}
                  selected={selectedIds.has(post.id)}
                  onSelect={handleSelect}
                  onDelete={handleDeleteSingle}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-zinc-500">
            Page {page} of {totalPages} ({total} posts)
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-2 text-sm border border-zinc-300 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 transition-colors min-h-[44px]"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-2 text-sm border border-zinc-300 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 transition-colors min-h-[44px]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <button
          onClick={handleNewPost}
          className="fixed bottom-6 right-6 z-30 h-14 w-14 bg-zinc-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
          aria-label="New post"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete post?"
        description={`This will permanently delete ${deleteTarget?.title || 'this post'}. This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
