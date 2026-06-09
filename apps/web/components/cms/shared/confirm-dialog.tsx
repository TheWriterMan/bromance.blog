'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button on open
  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const isDanger = variant === 'danger';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
      >
        <div className="bg-white rounded-lg border border-zinc-200 shadow-lg w-full max-w-sm p-6">
          <div className="flex items-start gap-3">
            {isDanger && (
              <div className="shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            )}
            <div className="flex-1">
              <h2
                id="confirm-dialog-title"
                className="text-base font-semibold text-zinc-900"
              >
                {title}
              </h2>
              <p
                id="confirm-dialog-desc"
                className="text-sm text-zinc-500 mt-1"
              >
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-6">
            <button
              ref={cancelRef}
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors min-h-[44px]"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
                isDanger
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
