'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings, Loader, Check, AlertCircle, Save, Send, RefreshCw } from 'lucide-react';

interface EditorHeaderProps {
  title: string;
  savingState: 'idle' | 'saving' | 'saved' | 'error';
  settingsOpen: boolean;
  onSave: () => void;
  onPublish: () => void;
  onToggleSettings: () => void;
  status: 'draft' | 'published' | 'scheduled';
}

export default function EditorHeader({
  title,
  savingState,
  settingsOpen,
  onSave,
  onPublish,
  onToggleSettings,
  status,
}: EditorHeaderProps) {
  const router = useRouter();
  const isSaving = savingState === 'saving';

  // Determine button labels based on actual post status
  const saveLabel = status === 'published' ? 'Save' : status === 'scheduled' ? 'Save' : 'Save draft';
  const publishLabel = status === 'published' ? 'Update' : status === 'scheduled' ? 'Publish now' : 'Publish';

  return (
    <header className="shrink-0 bg-white border-b border-zinc-200 z-40 px-3 sm:px-4 h-14 flex items-center justify-between">
      {/* Left: Back + status badge + save status */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push('/cms/posts')}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
          aria-label="Back to posts"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Post status badge */}
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
          status === 'published'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : status === 'scheduled'
            ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
        }`}>
          {status}
        </span>

        {/* Save status indicator */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          {savingState === 'saving' && (
            <>
              <Loader className="h-3.5 w-3.5 animate-spin" />
              <span className="hidden sm:inline">Saving…</span>
            </>
          )}
          {savingState === 'saved' && (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="hidden sm:inline text-emerald-600">Saved</span>
            </>
          )}
          {savingState === 'error' && (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
              <span className="hidden sm:inline text-red-600">Failed</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Save button — context-aware label */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-md transition-colors min-h-[44px] ${
            isSaving
              ? 'border-zinc-200 text-zinc-400 cursor-not-allowed'
              : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100'
          }`}
        >
          {isSaving ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saveLabel}
        </button>

        {/* Publish / Update button — context-aware */}
        <button
          onClick={onPublish}
          disabled={isSaving}
          className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors min-h-[44px] ${
            isSaving
              ? 'bg-zinc-400 text-white cursor-not-allowed'
              : status === 'published'
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800'
              : 'bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-700'
          }`}
        >
          {isSaving ? (
            <Loader className="h-3.5 w-3.5 animate-spin" />
          ) : status === 'published' ? (
            <RefreshCw className="h-3.5 w-3.5" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          {publishLabel}
        </button>

        {/* Settings toggle */}
        <button
          onClick={onToggleSettings}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md transition-colors ${
            settingsOpen
              ? 'bg-zinc-100 text-zinc-900'
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
          aria-label={settingsOpen ? 'Close settings' : 'Open settings'}
          aria-expanded={settingsOpen}
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
