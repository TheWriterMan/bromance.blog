'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown, ImagePlus, X, Upload } from 'lucide-react';
import type { Category, MediaItem } from '@repo/db';
import { getCloudinaryUrl } from '@/lib/utils';
import type { ContentType } from '@/lib/cms-api';

interface DocumentHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  onTitleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  titleRef: React.RefObject<HTMLDivElement | null>;
  featuredImage: string;
  onFeaturedImageChange: (cloudinaryId: string) => void;
  categories: Category[];
  categoryId: string;
  onCategoryChange: (id: string) => void;
  slug: string;
  onSlugChange: (slug: string) => void;
  publishedAt: string;
  onPublishedAtChange: (date: string) => void;
  status: 'draft' | 'published' | 'scheduled';
  onStatusChange: (status: 'draft' | 'published' | 'scheduled') => void;
  mediaItems: MediaItem[];
  // Content type
  postType: string;
  onPostTypeChange: (type: string) => void;
}

export default function DocumentHeader({
  title,
  onTitleChange,
  onTitleKeyDown,
  titleRef,
  featuredImage,
  onFeaturedImageChange,
  categories,
  categoryId,
  onCategoryChange,
  slug,
  onSlugChange,
  publishedAt,
  onPublishedAtChange,
  status,
  onStatusChange,
  mediaItems,
  postType,
  onPostTypeChange,
}: DocumentHeaderProps) {
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch content types (drives the Type selector)
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);

  useEffect(() => {
    fetch('/api/content-types')
      .then(r => r.json())
      .then((data: ContentType[]) => setContentTypes(data))
      .catch(() => {});
  }, []);

  const hasImage = featuredImage && featuredImage !== 'samples/workspace';

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        onFeaturedImageChange(data.cloudinary_id);
        setCoverPickerOpen(false);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleTitleInput(e: React.FormEvent<HTMLDivElement>) {
    const text = (e.target as HTMLDivElement).textContent || '';
    onTitleChange(text);
  }

  return (
    <div className="space-y-4 mb-8">
      {/* Block 1: Cover Image */}
      <div
        className="relative w-full rounded-lg overflow-hidden group"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {hasImage ? (
          <div className="relative aspect-[21/9] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getCloudinaryUrl(featuredImage)}
              alt="Cover"
              className="w-full h-full object-cover rounded-lg"
              referrerPolicy="no-referrer"
            />
            {/* Overlay controls on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => setCoverPickerOpen(!coverPickerOpen)}
                className="px-3 py-2 bg-white/90 text-zinc-900 text-xs font-medium rounded-md hover:bg-white transition-colors"
              >
                Change
              </button>
              <button
                onClick={() => onFeaturedImageChange('samples/workspace')}
                className="p-2 bg-white/90 text-zinc-900 rounded-md hover:bg-white transition-colors"
                aria-label="Remove cover image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCoverPickerOpen(!coverPickerOpen)}
            className="w-full aspect-[21/9] border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-lg flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs font-medium">Add cover image</span>
          </button>
        )}

        {/* Cover image picker popover */}
        {coverPickerOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-zinc-200 rounded-lg shadow-xl p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-700">Select Cover Image</span>
              <button
                onClick={() => setCoverPickerOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Upload button */}
            <label className="flex items-center gap-2 px-3 py-2.5 border border-zinc-200 rounded-md text-xs text-zinc-600 hover:bg-zinc-50 cursor-pointer transition-colors mb-3">
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Upload new image'}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </label>

            {/* Media library grid */}
            {mediaItems.length > 0 && (
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                {mediaItems.slice(0, 12).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onFeaturedImageChange(item.cloudinaryId);
                      setCoverPickerOpen(false);
                    }}
                    className={`aspect-square rounded border overflow-hidden transition-all ${
                      featuredImage === item.cloudinaryId
                        ? 'border-zinc-900 ring-2 ring-offset-1 ring-zinc-900'
                        : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getCloudinaryUrl(item.cloudinaryId)}
                      alt="Media"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Block 2: Title */}
      <div
        ref={titleRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleTitleInput}
        onKeyDown={onTitleKeyDown}
        data-placeholder="Untitled"
        className="w-full text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-200 empty:before:pointer-events-none"
        role="textbox"
        aria-label="Post title"
      />

      {/* Block 3: Document Meta Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-3 border-y border-zinc-100">
        {/* Category */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Cat</span>
          <div className="relative">
            <select
              value={categoryId}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="appearance-none pl-2 pr-6 py-1 text-sm font-medium text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-md hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 cursor-pointer min-h-[32px]"
            >
              <option value="">None</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Date</span>
          <input
            type="date"
            value={publishedAt}
            onChange={(e) => onPublishedAtChange(e.target.value)}
            className="px-2 py-1 text-sm text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-md hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 min-h-[32px]"
          />
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Status</span>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as 'draft' | 'published' | 'scheduled')}
              className={`appearance-none pl-2 pr-6 py-1 text-xs font-semibold rounded-md border cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-500 min-h-[32px] ${
                status === 'published'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : status === 'scheduled'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-600'
              }`}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* Type */}
        {contentTypes.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Type</span>
            <div className="relative">
              <select
                value={postType}
                onChange={(e) => onPostTypeChange(e.target.value)}
                aria-label="Content type"
                className="appearance-none pl-2 pr-6 py-1 text-sm font-medium text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-md hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 cursor-pointer min-h-[32px]"
              >
                {contentTypes.map((ct) => (
                  <option key={ct.key} value={ct.key}>{ct.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Slug — moved to settings panel */}
      </div>
    </div>
  );
}
