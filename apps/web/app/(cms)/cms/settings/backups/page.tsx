'use client'

import { useState, useEffect } from 'react'
import { HardDrive, Download, RotateCcw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/cms/page-header'
import { fetchBackups, createBackup, restoreBackup, formatFileSize } from '@/lib/cms-api'
import type { Backup } from '@/lib/cms-api'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'Less than an hour ago'
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    fetchBackups()
      .then(setBackups)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    setCreating(true)
    try {
      const backup = await createBackup()
      setBackups(prev => [backup, ...prev])
    } catch (e) {
      console.error(e)
    } finally {
      setCreating(false)
    }
  }

  async function handleRestore() {
    if (!restoreTarget) return
    setRestoring(true)
    try {
      await restoreBackup(restoreTarget.id)
      setRestoreTarget(null)
    } catch (e) {
      console.error(e)
    } finally {
      setRestoring(false)
    }
  }

  const latestBackup = backups[0]

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <PageHeader title="Backups" />
        <main className="flex-1 p-4 md:p-6">
          <div className="animate-pulse space-y-4 max-w-3xl">
            <div className="h-24 bg-muted rounded-lg" />
            <div className="h-48 bg-muted rounded-lg" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Backups"
        description={latestBackup ? `Last backup: ${timeAgo(latestBackup.createdAt)}` : 'No backups yet'}
        actions={
          <Button size="sm" className="min-h-[44px] gap-2" onClick={handleCreate} disabled={creating}>
            {creating ? (
              <span className="flex items-center gap-2">
                <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Creating…
              </span>
            ) : (
              <><HardDrive className="size-4" /> Create Backup Now</>
            )}
          </Button>
        }
      />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-3xl space-y-4">
          {backups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <HardDrive className="size-10 text-muted-foreground/40" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">No backups yet. Create your first backup to protect your data.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Date</TableHead>
                      <TableHead className="hidden sm:table-cell">Size</TableHead>
                      <TableHead className="hidden md:table-cell">Posts</TableHead>
                      <TableHead className="hidden md:table-cell">Categories</TableHead>
                      <TableHead className="hidden lg:table-cell">Media</TableHead>
                      <TableHead className="text-right pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map(backup => (
                      <TableRow key={backup.id} className="hover:bg-muted/30">
                        <TableCell className="py-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{formatDate(backup.createdAt)}</p>
                            <p className="text-xs text-muted-foreground">{timeAgo(backup.createdAt)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell py-3">
                          <span className="text-sm text-muted-foreground">{formatFileSize(backup.bytes)}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-3">
                          <Badge variant="secondary" className="text-xs">{backup.postCount}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-3">
                          <Badge variant="secondary" className="text-xs">{backup.categoryCount}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell py-3">
                          <Badge variant="secondary" className="text-xs">{backup.mediaCount}</Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right pr-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[44px] gap-2 text-xs"
                            onClick={() => setRestoreTarget(backup)}
                          >
                            <RotateCcw className="size-3.5" />
                            Restore
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Restore confirmation */}
      <AlertDialog open={!!restoreTarget} onOpenChange={() => setRestoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Restore from backup?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This will restore your database to the state captured on <strong>{restoreTarget && formatDate(restoreTarget.createdAt)}</strong>.
              </span>
              <span className="block text-amber-600 dark:text-amber-400">
                A safety backup of the current state will be created automatically before the restore begins.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={restoring} className="bg-amber-600 text-white hover:bg-amber-700">
              {restoring ? 'Restoring…' : 'Yes, restore'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
