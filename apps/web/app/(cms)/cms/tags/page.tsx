'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CmsShell from '@/components/cms/layout/cms-shell';
import ConfirmDialog from '@/components/cms/shared/confirm-dialog';
import { Plus, Trash2, Check, X } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  slug: string;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleCreate = async () => {
    if (!addName.trim()) return;
    try {
      const slug = generateSlug(addName);
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addName.trim(), slug }),
      });
      if (res.ok) {
        const newTag = await res.json();
        setTags(prev => [newTag, ...prev]);
        setAddName('');
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/tags/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setTags(prev => prev.filter(t => t.id !== deleteTarget.id));
      }
    } catch (error) {
      console.error('Failed to delete tag:', error);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') { setShowAddForm(false); setAddName(''); }
  };

  return (
    <CmsShell>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Tags</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            Add Tag
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="border border-zinc-200 rounded-lg p-4 mb-4 bg-zinc-50">
            <div className="flex gap-3 items-center">
              <input
                type="text"
                placeholder="Tag name"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                onKeyDown={handleAddKeyDown}
                className="flex-1 px-3 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 min-h-[44px]"
                autoFocus
              />
              {addName && (
                <span className="text-xs text-zinc-400 shrink-0">
                  slug: {generateSlug(addName)}
                </span>
              )}
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors min-h-[44px]"
              >
                <Check className="h-4 w-4" />
                Save
              </button>
              <button
                onClick={() => { setShowAddForm(false); setAddName(''); }}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-md hover:bg-zinc-100 transition-colors min-h-[44px]"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tags List */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading tags...</div>
        ) : tags.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">
            No tags yet. Create your first one above.
          </div>
        ) : (
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-4 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <span>Name</span>
              <span>Slug</span>
              <span className="w-10" />
            </div>

            {/* Table Rows */}
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="grid grid-cols-[1fr_1fr_auto] gap-4 px-4 py-3 border-b border-zinc-100 last:border-b-0 items-center hover:bg-zinc-50 transition-colors"
              >
                <span className="text-sm font-medium text-zinc-900">{tag.name}</span>
                <span className="text-sm text-zinc-500">{tag.slug}</span>
                <button
                  onClick={() => setDeleteTarget(tag)}
                  className="p-2 rounded hover:bg-red-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={`Delete ${tag.name}`}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete Tag"
          description={`Are you sure you want to delete "${deleteTarget?.name}"? This tag will be removed from all posts.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </CmsShell>
  );
}
