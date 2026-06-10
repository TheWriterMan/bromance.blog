'use client';

import { useState, useEffect, useCallback } from 'react';
import CmsShell from '@/components/cms/layout/cms-shell';
import { Database, Download, RotateCcw, Plus, AlertTriangle, Clock, HardDrive } from 'lucide-react';

interface BackupRecord {
  id: string;
  cloudinary_id: string;
  filename: string;
  bytes: number;
  post_count: number;
  category_count: number;
  tag_count: number;
  media_count: number;
  created_at: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchBackups = useCallback(async () => {
    try {
      const res = await fetch('/api/backups');
      if (!res.ok) throw new Error('Failed to load backups');
      const data = await res.json();
      setBackups(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load backups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  async function handleCreateBackup() {
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/backups', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Backup creation failed');
      }
      setSuccess('Backup created successfully.');
      await fetchBackups();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Backup creation failed');
    } finally {
      setCreating(false);
    }
  }

  async function handleRestore(backupId: string) {
    setRestoring(backupId);
    setError(null);
    setSuccess(null);
    setConfirmRestore(null);

    try {
      const res = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup_id: backupId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Restore failed');
      }
      setSuccess('Database restored successfully. A safety backup was created before the restore.');
      await fetchBackups();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restore failed');
    } finally {
      setRestoring(null);
    }
  }

  const lastBackup = backups[0];

  return (
    <CmsShell>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Backups</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Database backups are created every 6 hours automatically. You can also create one manually.
            </p>
          </div>
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            {creating ? 'Creating…' : 'Create Backup Now'}
          </button>
        </div>

        {/* Status messages */}
        {error && (
          <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="border border-green-200 bg-green-50 rounded-lg p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Last backup indicator */}
        {lastBackup && (
          <div className="border border-zinc-200 rounded-lg bg-white p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-zinc-400" />
            <div>
              <p className="text-sm font-medium text-zinc-900">
                Last backup: {timeAgo(lastBackup.created_at)}
              </p>
              <p className="text-xs text-zinc-500">
                {formatDate(lastBackup.created_at)} · {formatBytes(lastBackup.bytes)}
              </p>
            </div>
          </div>
        )}

        {/* Backups list */}
        {loading ? (
          <div className="border border-zinc-200 rounded-lg bg-white p-8 text-center">
            <p className="text-zinc-400 text-sm">Loading backups…</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="border border-zinc-200 rounded-lg bg-white p-8 text-center">
            <Database className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No backups yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="border border-zinc-200 rounded-lg bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Timestamp</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Size</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Posts</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Categories</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Tags</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Media</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50">
                    <td className="px-4 py-3">
                      <span className="text-zinc-900">{formatDate(backup.created_at)}</span>
                      <span className="block text-xs text-zinc-400">{timeAgo(backup.created_at)}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      <span className="inline-flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {formatBytes(backup.bytes)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{backup.post_count}</td>
                    <td className="px-4 py-3 text-zinc-600">{backup.category_count}</td>
                    <td className="px-4 py-3 text-zinc-600">{backup.tag_count}</td>
                    <td className="px-4 py-3 text-zinc-600">{backup.media_count}</td>
                    <td className="px-4 py-3 text-right">
                      {confirmRestore === backup.id ? (
                        <div className="inline-flex items-center gap-2">
                          <span className="text-xs text-red-600 font-medium">Restore this backup?</span>
                          <button
                            onClick={() => handleRestore(backup.id)}
                            disabled={restoring !== null}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
                          >
                            {restoring === backup.id ? 'Restoring…' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirmRestore(null)}
                            className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRestore(backup.id)}
                          disabled={restoring !== null}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Restore
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Info box */}
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Restore is atomic</p>
            <p>
              Restoring replaces all database content with the selected backup. A safety backup is
              always created before any restore. If the restore fails for any reason, nothing changes.
            </p>
          </div>
        </div>
      </div>
    </CmsShell>
  );
}
