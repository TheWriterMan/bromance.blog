'use client';

import React from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';

interface RecoveryPromptProps {
  savedAt: number; // Unix timestamp ms
  onRestore: () => void;
  onDiscard: () => void;
}

export default function RecoveryPrompt({ savedAt, onRestore, onDiscard }: RecoveryPromptProps) {
  const timeStr = new Date(savedAt).toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-lg border border-zinc-200 shadow-lg w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-zinc-900 mb-1">Recover unsaved changes?</h2>
        <p className="text-sm text-zinc-500 mb-6">
          You have unsaved changes from <strong>{timeStr}</strong>. Would you like to restore them?
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onDiscard}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors min-h-[44px]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Discard
          </button>
          <button
            onClick={onRestore}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors min-h-[44px]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restore
          </button>
        </div>
      </div>
    </div>
  );
}
