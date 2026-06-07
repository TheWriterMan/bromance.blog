'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings, Loader, Check, AlertCircle } from 'lucide-react';

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

  return (
    <header className="shrink-0 bg-white border-b border-zinc-200 z-40 px-3 sm:px-4 h-14 flex items-center justify-between">
      {/* Left: Back + save status */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push('/cms/posts')}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
          aria-label="Back to posts"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Save indicator */}
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
              <span className="hidden sm:inline">Saved</span>
            </>
          )}
          {savingState === 'error' && (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
              <span className="hidden sm:inline text-red-600">Error</span>
            </>
          )}
          {savingState === 'idle' && title && (
            <span className="hidden sm:inline text-zinc-400 truncate max-w-[200px]">{title}</span>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Save button (visible on desktop) */}
        <button
          onClick={onSave}
          className="hidden sm:inline-flex items-center px-3 py-2 text-xs font-medium text-zinc-700 border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors min-h-[44px]"
        >
          Save
        </button>

        {/* Publish / Update button */}
        <button
          onClick={onPublish}
          className="inline-flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors min-h-[44px]"
        >
          {status === 'published' ? 'Update' : 'Publish'}
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
