'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CmsShell from '@/components/cms/layout/cms-shell';
import ConfirmDialog from '@/components/cms/shared/confirm-dialog';
import { Plus, Trash2, Check, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', slug: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', slug: '', description: '' });
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddNameChange = (name: string) => {
    setAddForm({ ...addForm, name, slug: generateSlug(name) });
  };

  const handleCreate = async () => {
    if (!addForm.name.trim()) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name.trim(),
          slug: addForm.slug || generateSlug(addForm.name),
          description: addForm.description.trim(),
        }),
      });
      if (res.ok) {
        const newCat = await res.json();
        setCategories(prev => [newCat, ...prev]);
        setAddForm({ name: '', slug: '', description: '' });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, slug: cat.slug, description: cat.description });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', slug: '', description: '' });
  };

  const handleUpdate = async () => {
    if (!editingId || !editForm.name.trim()) return;
    try {
      const res = await fetch(`/api/categories/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          slug: editForm.slug || generateSlug(editForm.name),
          description: editForm.description.trim(),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCategories(prev => prev.map(c => (c.id === editingId ? updated : c)));
        cancelEdit();
      }
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/categories/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleUpdate();
    if (e.key === 'Escape') cancelEdit();
  };

  return (
    <CmsShell>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Categories</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="border border-zinc-200 rounded-lg p-4 mb-4 bg-zinc-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input
                type="text"
                placeholder="Category name"
                value={addForm.name}
                onChange={(e) => handleAddNameChange(e.target.value)}
                className="px-3 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 min-h-[44px]"
                autoFocus
              />
              <input
                type="text"
                placeholder="slug (auto-generated)"
                value={addForm.slug}
                onChange={(e) => setAddForm({ ...addForm, slug: e.target.value })}
                className="px-3 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 min-h-[44px] text-zinc-500"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                className="px-3 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 min-h-[44px]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors min-h-[44px]"
              >
                <Check className="h-4 w-4" />
                Save
              </button>
              <button
                onClick={() => { setShowAddForm(false); setAddForm({ name: '', slug: '', description: '' }); }}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-md hover:bg-zinc-100 transition-colors min-h-[44px]"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Categories List */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">
            No categories yet. Create your first one above.
          </div>
        ) : (
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_1fr_2fr_auto] gap-4 px-4 py-3 bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <span>Name</span>
              <span>Slug</span>
              <span>Description</span>
              <span className="w-10" />
            </div>

            {/* Table Rows */}
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="grid grid-cols-[1fr_1fr_2fr_auto] gap-4 px-4 py-3 border-b border-zinc-100 last:border-b-0 items-center hover:bg-zinc-50 transition-colors"
              >
                {editingId === cat.id ? (
                  <>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value, slug: generateSlug(e.target.value) })}
                      onKeyDown={handleEditKeyDown}
                      onBlur={handleUpdate}
                      className="px-2 py-1.5 text-sm border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-zinc-900 min-h-[44px]"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editForm.slug}
                      onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                      onKeyDown={handleEditKeyDown}
                      className="px-2 py-1.5 text-sm border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-zinc-900 min-h-[44px] text-zinc-500"
                    />
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      onKeyDown={handleEditKeyDown}
                      className="px-2 py-1.5 text-sm border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-zinc-900 min-h-[44px]"
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={handleUpdate}
                        className="p-2 rounded hover:bg-zinc-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Save"
                      >
                        <Check className="h-4 w-4 text-emerald-600" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-2 rounded hover:bg-zinc-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Cancel"
                      >
                        <X className="h-4 w-4 text-zinc-500" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(cat)}
                      className="text-left text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors min-h-[44px] flex items-center"
                    >
                      {cat.name}
                    </button>
                    <span className="text-sm text-zinc-500">{cat.slug}</span>
                    <span className="text-sm text-zinc-600 truncate">{cat.description}</span>
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      className="p-2 rounded hover:bg-red-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label={`Delete ${cat.name}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete Category"
          description={`Are you sure you want to delete "${deleteTarget?.name}"? Posts in this category may be affected.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </CmsShell>
  );
}
