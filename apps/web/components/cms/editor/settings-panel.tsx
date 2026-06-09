'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Tag, PostRevision } from '@repo/db';

interface SettingsPanelProps {
  open: boolean;
  summary: string;
  onSummaryChange: (summary: string) => void;
  tags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
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
  revisions: PostRevision[];
  postId: string | null;
  onRestoreRevision: (revisionId: string) => void;
  onClose: () => void;
}

export default function SettingsPanel(props: SettingsPanelProps) {
  const {
    open, summary, onSummaryChange,
    tags, selectedTagIds, onToggleTag,
    metaTitle, onMetaTitleChange, metaDescription, onMetaDescriptionChange,
    canonicalUrl, onCanonicalUrlChange, noindex, onNoindexChange,
    ogImage, onOgImageChange, revisions, postId,
    onRestoreRevision, onClose,
  } = props;

  const isMobile = useIsMobile();

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open, isMobile]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const panelContent = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-zinc-200 flex items-center justify-between bg-white sticky top-0 z-10">
        <h3 className="font-semibold text-sm text-zinc-900">Post Settings</h3>
        <button
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-zinc-900 rounded-md transition-colors"
          aria-label="Close settings"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Summary */}
        <FieldGroup label="Summary / Excerpt">
          <textarea
            value={summary}
            onChange={(e) => onSummaryChange(e.target.value)}
            placeholder="A short description..."
            rows={3}
            className="w-full px-3 py-2.5 border border-zinc-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
          />
        </FieldGroup>

        <Separator />

        {/* Tags */}
        <FieldGroup label="Tags">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => {
              const isSelected = selectedTagIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => onToggleTag(t.id)}
                  className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors min-h-[44px] flex items-center ${
                    isSelected
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400'
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </FieldGroup>

        <Separator />

        {/* SEO Settings */}
        <FieldGroup label="SEO Settings">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Meta Title</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => onMetaTitleChange(e.target.value)}
                placeholder="Leave empty to use main title"
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-500 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Meta Description</label>
              <textarea
                value={metaDescription}
                onChange={(e) => onMetaDescriptionChange(e.target.value)}
                placeholder="Leave empty to use summary"
                rows={3}
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Canonical URL</label>
              <input
                type="text"
                value={canonicalUrl}
                onChange={(e) => onCanonicalUrlChange(e.target.value)}
                placeholder="https://original-source.com/post"
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-500 min-h-[44px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="settings-noindex"
                checked={noindex === 1}
                onChange={(e) => onNoindexChange(e.target.checked ? 1 : 0)}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
              />
              <label htmlFor="settings-noindex" className="text-xs text-zinc-600 cursor-pointer">
                Hide from search engines (noindex)
              </label>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">OG Image URL</label>
              <input
                type="text"
                value={ogImage}
                onChange={(e) => onOgImageChange(e.target.value)}
                placeholder="Leave empty to use cover"
                className="w-full px-3 py-2.5 border border-zinc-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-500 min-h-[44px]"
              />
            </div>
          </div>
        </FieldGroup>

        {/* Revisions */}
        {postId && revisions.length > 0 && (
          <>
            <Separator />
            <FieldGroup label="Revisions">
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {revisions.map((rev) => (
                  <div key={rev.id} className="p-3 bg-zinc-50 border border-zinc-200 rounded-md flex items-center justify-between min-h-[44px]">
                    <span className="text-xs text-zinc-500 font-mono">
                      {new Date(rev.createdAt).toLocaleTimeString()}
                    </span>
                    <button
                      onClick={() => onRestoreRevision(rev.id)}
                      className="text-xs font-medium text-zinc-700 hover:text-zinc-900 px-2 py-1 rounded hover:bg-zinc-100 transition-colors"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </FieldGroup>
          </>
        )}
      </div>
    </div>
  );

  // Mobile: Bottom sheet with backdrop
  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
        <div
          className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-xl border-t border-zinc-200 shadow-2xl max-h-[85vh] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Post settings"
        >
          {/* Drag handle */}
          <div className="flex justify-center py-2 shrink-0">
            <div className="w-10 h-1 rounded-full bg-zinc-300" />
          </div>
          {panelContent}
        </div>
      </>
    );
  }

  // Desktop: Side panel that pushes layout
  return (
    <div className="w-80 shrink-0 border-l border-zinc-200 bg-white h-full overflow-hidden">
      {panelContent}
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-zinc-700">{label}</label>
      {children}
    </div>
  );
}

function Separator() {
  return <div className="h-px bg-zinc-200 w-full" />;
}
