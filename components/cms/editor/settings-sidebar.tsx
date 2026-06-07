'use client';

import React from 'react';
import { X, User, History } from 'lucide-react';
import { Tag, MediaItem, PostRevision } from '@/lib/db';
import { getCloudinaryUrl } from '@/lib/utils';

interface SettingsSidebarProps {
  status: 'draft' | 'published' | 'scheduled';
  onStatusChange: (status: 'draft' | 'published' | 'scheduled') => void;
  publishedAt: string;
  onPublishedAtChange: (date: string) => void;
  authorName: string;
  slug: string;
  onSlugChange: (slug: string) => void;
  summary: string;
  onSummaryChange: (summary: string) => void;
  tags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  featuredImage: string;
  onFeaturedImageSelect: (id: string) => void;
  metaTitle: string;
  onMetaTitleChange: (v: string) => void;
  metaDescription: string;
  onMetaDescriptionChange: (v: string) => void;
  canonicalUrl: string;
  onCanonicalUrlChange: (v: string) => void;
  noindex: number;
  onNoindexChange: (v: number) => void;
  ogImage: string;
  onOgImageChange: (v: string) => void;
  mediaItems: MediaItem[];
  revisions: PostRevision[];
  postId: string | null;
  onRestoreRevision: (revisionId: string) => void;
  onClose: () => void;
}

export default function SettingsSidebar({
  status,
  onStatusChange,
  publishedAt,
  onPublishedAtChange,
  authorName,
  slug,
  onSlugChange,
  summary,
  onSummaryChange,
  tags,
  selectedTagIds,
  onToggleTag,
  featuredImage,
  onFeaturedImageSelect,
  metaTitle,
  onMetaTitleChange,
  metaDescription,
  onMetaDescriptionChange,
  canonicalUrl,
  onCanonicalUrlChange,
  noindex,
  onNoindexChange,
  ogImage,
  onOgImageChange,
  mediaItems,
  revisions,
  postId,
  onRestoreRevision,
  onClose,
}: SettingsSidebarProps) {
  return (
    <div className="w-80 shrink-0 border-l border-zinc-200 bg-zinc-50/50 h-full overflow-y-auto relative animate-fade-in z-20" id="editor-settings-sidebar">
      <div className="p-4 border-b border-zinc-200 flex items-center justify-between sticky top-0 bg-zinc-50/95 backdrop-blur z-10">
        <h3 className="font-semibold text-sm text-zinc-900">Post Settings</h3>
        <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-900 rounded cursor-pointer" id="btn-close-sidebar">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-5 space-y-6">
        
        {/* Meta Core Set */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="select-post-status" className="text-xs font-semibold text-zinc-650">Status</label>
            <select
              value={status}
              onChange={(e: any) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400 bg-white cursor-pointer"
              id="select-post-status"
              aria-label="Post status"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="input-publish-date" className="text-xs font-semibold text-zinc-650">Publish Date</label>
            <input
              type="date"
              value={publishedAt}
              onChange={(e) => onPublishedAtChange(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400 bg-white"
              id="input-publish-date"
              aria-label="Publish date"
            />
          </div>
          
          <div className="space-y-1.5">
            <label htmlFor="input-author-disabled" className="text-xs font-semibold text-zinc-650 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Author
            </label>
            <input
              type="text"
              disabled
              value={authorName}
              className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm bg-zinc-100 text-zinc-500"
              id="input-author-disabled"
              aria-label="Author"
            />
          </div>
        </div>

        <div className="h-px bg-zinc-200 w-full" />

        {/* Slug */}
        <div className="space-y-1.5">
            <label htmlFor="input-url-slug" className="text-xs font-semibold text-zinc-650">URL Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="my-awesome-post"
            className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400 bg-white font-mono"
            id="input-url-slug"
            aria-label="URL slug"
          />
        </div>

        <div className="h-px bg-zinc-200 w-full" />

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="textarea-post-summary" className="text-xs font-semibold text-zinc-650">Summary / Excerpt</label>
          <textarea
            value={summary}
            onChange={(e) => onSummaryChange(e.target.value)}
            placeholder="A short description..."
            rows={3}
            className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400 bg-white"
            id="textarea-post-summary"
            aria-label="Post summary or excerpt"
          />
        </div>

        <div className="h-px bg-zinc-200 w-full" />

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-650">Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map(t => {
              const isSelected = selectedTagIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => onToggleTag(t.id)}
                  className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                    isSelected ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-650 hover:border-zinc-400'
                  }`}
                  id={`btn-toggle-tag-${t.slug}`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-zinc-200 w-full" />

        {/* Cover Image */}
        <div className="space-y-2 pb-6">
          <label className="text-xs font-semibold text-zinc-650">Cover Image</label>
          <div className="aspect-video w-full rounded-lg bg-zinc-100 flex items-center justify-center overflow-hidden border border-zinc-200" id="cover-image-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getCloudinaryUrl(featuredImage)}
              alt="Cover"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <div className="pt-2 flex flex-col gap-2">
            <label className="w-full text-xs py-1.5 border border-zinc-200 rounded text-zinc-600 hover:bg-zinc-100 text-center cursor-pointer">
              Upload New Image
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    const base64 = reader.result as string;
                    try {
                      // Save to media library
                      const res = await fetch('/api/media', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          filename: file.name,
                          base64
                        })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        onFeaturedImageSelect(data.cloudinary_id);
                      }
                    } catch (e) {
                      console.error('Upload failed', e);
                    }
                  };
                  reader.readAsDataURL(file);
                }} 
              />
            </label>
            <button
              onClick={() => {
                const url = prompt('Enter the Cloudinary ID or image seed word (e.g. nature, cars):');
                if (url) {
                  onFeaturedImageSelect(url);
                }
              }}
              className="w-full text-xs py-1.5 border border-zinc-200 rounded text-zinc-600 hover:bg-zinc-100"
            >
              Set from custom topic/URL
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2" id="cover-image-thumbs">
            {mediaItems.slice(0, 8).map(item => (
              <button
                key={item.id}
                onClick={() => onFeaturedImageSelect(item.cloudinary_id)}
                className={`aspect-square rounded border overflow-hidden cursor-pointer ${
                  featuredImage === item.cloudinary_id ? 'border-zinc-900 ring-2 ring-offset-1 ring-zinc-900' : 'border-zinc-205 hover:border-zinc-400'
                }`}
              >
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getCloudinaryUrl(item.cloudinary_id)}
                  alt="Thumb"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-zinc-200 w-full" />

        {/* SEO Settings */}
        <div className="space-y-4">
          <label className="text-xs font-semibold text-zinc-650">SEO Settings</label>
          
          <div className="space-y-1.5 pt-1">
            <label htmlFor="input-meta-title" className="text-xs text-zinc-500">SEO Meta Title</label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => onMetaTitleChange(e.target.value)}
              placeholder="Leave empty to use main title"
              className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400 bg-white"
              id="input-meta-title"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="textarea-meta-desc" className="text-xs text-zinc-500">SEO Meta Description</label>
            <textarea
              value={metaDescription}
              onChange={(e) => onMetaDescriptionChange(e.target.value)}
              placeholder="Leave empty to use summary"
              rows={3}
              className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400 bg-white"
              id="textarea-meta-desc"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="input-canonical-url" className="text-xs text-zinc-500">Canonical URL Override</label>
            <input
              type="text"
              value={canonicalUrl}
              onChange={(e) => onCanonicalUrlChange(e.target.value)}
              placeholder="https://original-source.com/post"
              className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400 bg-white placeholder-zinc-300"
              id="input-canonical-url"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="checkbox-noindex"
              checked={noindex === 1}
              onChange={(e) => onNoindexChange(e.target.checked ? 1 : 0)}
              className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
            />
            <label htmlFor="checkbox-noindex" className="text-xs text-zinc-650 cursor-pointer">
              Hide from search engines (Noindex)
            </label>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-zinc-100">
            <label htmlFor="input-og-image" className="text-xs text-zinc-500">Open Graph Image URL</label>
            <input
              type="text"
              value={ogImage}
              onChange={(e) => onOgImageChange(e.target.value)}
              placeholder="Leave empty to use Cover"
              className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400 bg-white placeholder-zinc-300"
              id="input-og-image"
            />
          </div>
        </div>

        {postId && revisions.length > 0 && (
          <>
            <div className="h-px bg-zinc-200 w-full" />
            <div className="space-y-2 pb-6" id="post-revisions-section">
              <label className="text-xs font-semibold text-zinc-650 flex items-center gap-1.5"><History className="h-3.5 w-3.5" /> Revisions</label>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {revisions.map(rev => (
                  <div key={rev.id} className="p-2.5 bg-white border border-zinc-200 rounded-md flex items-center justify-between">
                    <span className="text-xs text-zinc-500 font-mono">{new Date(rev.created_at).toLocaleTimeString()}</span>
                    <button
                      onClick={() => onRestoreRevision(rev.id)}
                      className="text-[10px] uppercase font-bold text-zinc-700 bg-zinc-150 hover:bg-zinc-250 px-2 py-1 rounded cursor-pointer"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
