'use client';

import React from 'react';
import { ArrowLeft, Settings } from 'lucide-react';

interface EditorHeaderProps {
  title: string;
  lastSavedTime: string | null;
  savingState: 'idle' | 'saving' | 'saved' | 'error';
  sidebarOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onToggleSidebar: () => void;
}

export default function EditorHeader({
  title,
  lastSavedTime,
  savingState,
  sidebarOpen,
  onClose,
  onSave,
  onToggleSidebar,
}: EditorHeaderProps) {
  return (
    <header className="shrink-0 bg-stone-50 border-b-2 border-stone-200 z-40 px-6 h-16 flex items-center justify-between" id="editor-header">
      <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-widest">
        <button 
          onClick={onClose}
          className="font-bold text-stone-900 flex items-center hover:text-red-900 cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-400 rounded transition-colors"
          id="btn-editor-back-brand"
          aria-label="Go back to Dashboard"
        >
          <ArrowLeft className="h-4 w-4 mr-2 text-stone-500" />
          Bromance Workspace
        </button>
        <span className="text-stone-300" aria-hidden="true">|</span>
        <span className="text-stone-900 font-bold truncate max-w-xs">{title || 'Unfiled Dossier'}</span>
      </div>

      <div className="flex items-center space-x-4 text-sm font-mono tracking-widest uppercase">
        {lastSavedTime && (
          <span className="text-stone-400 text-[10px] hidden sm:inline-block">
            {savingState === 'saving' ? 'Syncing...' : `Saved ${lastSavedTime}`}
          </span>
        )}
        <button
          onClick={onSave}
          disabled={savingState === 'saving'}
          className="px-4 py-2 border border-stone-300 bg-white hover:bg-stone-100 text-stone-900 rounded text-xs font-bold transition disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
          id="btn-save-post"
          aria-label="Save dossier"
        >
          {savingState === 'saving' ? 'Filing...' : 'File Record'}
        </button>
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-400 ${
            sidebarOpen ? 'bg-stone-200 border-stone-300 text-stone-900' : 'bg-white border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-100'
          }`}
          title="Toggle Settings Sidebar"
          id="btn-toggle-editor-sidebar"
          aria-label={sidebarOpen ? "Close settings sidebar" : "Open settings sidebar"}
          aria-expanded={sidebarOpen}
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
