'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import CmsShell from '@/components/cms/layout/cms-shell';
import { getCloudinaryUrl } from '@/lib/utils';
import { Search, Upload, X, Copy, Trash2, Image, CheckSquare, Square, Minus } from 'lucide-react';
import ConfirmDialog from '@/components/cms/shared/confirm-dialog';

interface MediaItem {
  id: string;
  cloudinary_id: string;
  filename: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  created_at: string;
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    try {
      const res = await fetch('/api/media');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleUpload = async (files: FileList | File[]) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const formData = new FormData();
        formData.append('file', file);
        await fetch('/api/media/upload', { method: 'POST', body: formData });
      }
      await fetchMedia();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/media/${deleteTarget.id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
      if (selectedItem?.id === deleteTarget.id) setSelectedItem(null);
      selectedIds.delete(deleteTarget.id);
      setSelectedIds(new Set(selectedIds));
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch('/api/media/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (res.ok) {
        setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
        if (selectedItem && selectedIds.has(selectedItem.id)) setSelectedItem(null);
        setSelectedIds(new Set());
        setSelectionMode(false);
      }
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setBulkDeleteConfirm(false);
    }
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleReconcile = async () => {
    setReconciling(true);
    setReconcileResult(null);
    try {
      const res = await fetch('/api/media/reconcile', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setReconcileResult(`Synced ${data.reconciled} image${data.reconciled !== 1 ? 's' : ''} from posts`);
        if (data.reconciled > 0) await fetchMedia();
      } else {
        setReconcileResult(data.error || 'Sync failed');
      }
    } catch {
      setReconcileResult('Sync failed');
    } finally {
      setReconciling(false);
      setTimeout(() => setReconcileResult(null), 4000);
    }
  };

  const copyUrl = (item: MediaItem) => {
    const url = getCloudinaryUrl(item.cloudinary_id, 'content');
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredItems = items.filter(item =>
    item.filename.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = filteredItems.length > 0 && selectedIds.size === filteredItems.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredItems.length;

  return (
    <CmsShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Media Library</h1>
          <div className="flex items-center gap-2">
            {reconcileResult && (
              <span className="text-xs text-zinc-500">{reconcileResult}</span>
            )}
            <button
              onClick={handleReconcile}
              disabled={reconciling}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              {reconciling ? 'Syncing…' : 'Sync from posts'}
            </button>
            {selectionMode ? (
              <>
                <button
                  onClick={selectAll}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  {allSelected ? <CheckSquare className="h-4 w-4" /> : someSelected ? <Minus className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
                {selectedIds.size > 0 && (
                  <button
                    onClick={() => setBulkDeleteConfirm(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete ({selectedIds.size})
                  </button>
                )}
                <button
                  onClick={exitSelectionMode}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setSelectionMode(true)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                <CheckSquare className="h-4 w-4" />
                Select
              </button>
            )}
          </div>
        </div>

        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-zinc-900 bg-zinc-50'
              : 'border-zinc-300 hover:border-zinc-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
          <Upload className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
          <p className="text-sm text-zinc-600">
            {uploading ? 'Uploading...' : 'Drag & drop images here, or click to browse'}
          </p>
          <p className="text-xs text-zinc-400 mt-1">Accepts image files</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent min-h-[44px]"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading media...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Image className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No media items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (selectionMode) {
                    toggleSelection(item.id);
                  } else {
                    setSelectedItem(item);
                  }
                }}
                className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all min-h-[44px] ${
                  selectedIds.has(item.id)
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : selectedItem?.id === item.id
                    ? 'border-zinc-900 ring-2 ring-zinc-900/20'
                    : 'border-zinc-200 hover:border-zinc-400'
                }`}
              >
                <img
                  src={getCloudinaryUrl(item.cloudinary_id, 'thumbnail')}
                  alt={item.filename}
                  className="w-full h-full object-cover"
                />
                {/* Selection checkbox overlay */}
                {selectionMode && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                      selectedIds.has(item.id)
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white/80 border-zinc-400'
                    }`}>
                      {selectedIds.has(item.id) && (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">{item.filename}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Detail Panel */}
        {selectedItem && !selectionMode && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-lg border border-zinc-200 shadow-xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-900 truncate pr-4">
                  {selectedItem.filename}
                </h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 rounded-md hover:bg-zinc-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Close detail"
                >
                  <X className="h-5 w-5 text-zinc-500" />
                </button>
              </div>

              <div className="aspect-video rounded-lg overflow-hidden bg-zinc-100 mb-4">
                <img
                  src={getCloudinaryUrl(selectedItem.cloudinary_id, 'content')}
                  alt={selectedItem.filename}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Dimensions</span>
                  <span className="text-zinc-900">{selectedItem.width} x {selectedItem.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Format</span>
                  <span className="text-zinc-900 uppercase">{selectedItem.format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Size</span>
                  <span className="text-zinc-900">{formatBytes(selectedItem.bytes)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => copyUrl(selectedItem)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors min-h-[44px]"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy URL'}
                </button>
                <button
                  onClick={() => setDeleteTarget(selectedItem)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors min-h-[44px]"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Single Delete Confirmation */}
        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete Media"
          description={`Are you sure you want to delete "${deleteTarget?.filename}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />

        {/* Bulk Delete Confirmation */}
        <ConfirmDialog
          open={bulkDeleteConfirm}
          title="Delete Selected Media"
          description={`Are you sure you want to delete ${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`}
          confirmLabel={`Delete ${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''}`}
          variant="danger"
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkDeleteConfirm(false)}
        />
      </div>
    </CmsShell>
  );
}
