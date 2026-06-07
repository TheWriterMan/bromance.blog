'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Search, Loader } from 'lucide-react';
import { getCloudinaryUrl } from '@/lib/utils';

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

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: { cloudinary_id: string; url: string }) => void;
}

export default function MediaPickerModal({ open, onClose, onSelect }: MediaPickerModalProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    fetchMedia();
  }, [open]);

  async function fetchMedia() {
    try {
      setLoading(true);
      const res = await fetch('/api/media');
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch media:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      // Insert into editor / set as cover
      onSelect({ cloudinary_id: data.cloudinary_id, url: data.url });
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleSelect(item: MediaItem) {
    const url = getCloudinaryUrl(item.cloudinary_id, 'content');
    onSelect({ cloudinary_id: item.cloudinary_id, url });
    onClose();
  }

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Lock scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const filtered = searchQuery
    ? items.filter((i) => i.filename.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed inset-4 sm:inset-8 lg:inset-16 z-50 bg-white rounded-lg border border-zinc-200 shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Media library"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-zinc-200">
          <h2 className="text-base font-semibold text-zinc-900">Media Library</h2>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-zinc-900 rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 border-b border-zinc-100">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files…"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500 min-h-[44px]"
            />
          </div>

          {/* Upload button */}
          <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-md hover:bg-zinc-800 transition-colors cursor-pointer min-h-[44px]">
            {uploading ? <Loader className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading…' : 'Upload'}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-zinc-500">
                {searchQuery ? 'No images match your search.' : 'No images yet. Upload one to get started.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-zinc-200 hover:border-zinc-400 hover:ring-2 hover:ring-zinc-300 transition-all bg-zinc-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getCloudinaryUrl(item.cloudinary_id, 'thumbnail')}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-white truncate block">{item.filename}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
