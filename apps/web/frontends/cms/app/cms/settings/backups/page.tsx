'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  HardDrive,
  Plus,
  RotateCcw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  FolderOpen,
  ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/cms/page-header'
import { MOCK_BACKUPS, formatFileSize, type BackupEntry } from '@/lib/mock-data'
import { toast } from 'sonner'

function formatBackupDate(isoStr: string) {
  const d = new Date(isoStr)
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  )
}

function relativeHours(isoStr: string) {
  const diff = Date.now() - new Date(isoStr).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const mins = Math.floor(diff / (1000 * 60))
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function StatusIcon({ status }: { status: BackupEntry['status'] }) {
  if (status === 'complete') return <CheckCircle2 className="size-4 text-emerald-500" aria-label="Complete" />
  if (status === 'in-progress') return <Loader2 className="size-4 text-blue-400 animate-spin" aria-label="In progress" />
  return <XCircle className="size-4 text-destructive" aria-label="Failed" />
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupEntry[]>(MOCK_BACKUPS)
  const [creating, setCreating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [restoreTarget, setRestoreTarget] = useState<BackupEntry | null>(null)

  const latest = backups[0]

  async function handleCreateBackup() {
    setCreating(true)
    setProgress(0)
    const steps = [10, 25, 40, 60, 75, 90, 100]
    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 200))
      setProgress(step)
    }
    const newBackup: BackupEntry = {
      id: `bk-${Date.now()}`,
      createdAt: new Date().toISOString(),
      sizeBytes: 24500000 + Math.floor(Math.random() * 500000),
      postCount: backups[0].postCount,
      categoryCount: backups[0].categoryCount,
      mediaCount: backups[0].mediaCount,
      status: 'complete',
      triggeredBy: 'manual',
    }
    setBackups((prev) => [newBackup, ...prev])
    setCreating(false)
    setProgress(0)
    toast.success('Backup created successfully')
  }

  async function confirmRestore() {
    if (!restoreTarget) return
    setRestoreTarget(null)
    toast.loading('Restoring backup…', { id: 'restore' })
    await new Promise((r) => setTimeout(r, 1500))
    toast.success('Site restored from backup', { id: 'restore' })
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Backups"
        description={latest ? `Last backup: ${relativeHours(latest.createdAt)}` : 'No backups yet'}
        actions={
          <Button
            size="sm"
            className="min-h-[44px] gap-2"
            onClick={handleCreateBackup}
            disabled={creating}
          >
            {creating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Creating…
              </span>
            ) : (
              <>
                <Plus className="size-4" data-icon="inline-start" />
                Create Backup Now
              </>
            )}
          </Button>
        }
      />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-3xl space-y-6">

          {/* Back link */}
          <Link href="/cms/settings">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground -ml-2 h-9 mb-6"
            >
              <ArrowLeft className="size-4" />
              Site Settings
            </Button>
          </Link>

          {/* Progress bar while creating */}
          {creating && (
            <Card className="border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 text-blue-500 animate-spin" />
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Creating backup…</p>
                </div>
                <Progress value={progress} className="h-1.5" />
                <p className="text-xs text-blue-600 dark:text-blue-400/80">
                  {progress < 50 ? 'Gathering posts and media…' : progress < 90 ? 'Compressing backup archive…' : 'Finalising…'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Latest backup summary */}
          {latest && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Last Backup', value: relativeHours(latest.createdAt), icon: Clock },
                { label: 'Posts', value: latest.postCount, icon: FileText },
                { label: 'Categories', value: latest.categoryCount, icon: FolderOpen },
                { label: 'Media Files', value: latest.mediaCount, icon: ImageIcon },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-3 flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                      <stat.icon className="size-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-sm font-semibold text-foreground">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Info notice */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border text-muted-foreground">
            <HardDrive className="size-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs leading-relaxed">
              Backups include all posts, categories, settings, and media file references. A
              <strong className="text-foreground"> safety backup is automatically created</strong> before
              any restore operation. Backups are retained for <strong className="text-foreground">30 days</strong>.
            </p>
          </div>

          {/* Backup list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Backup History</CardTitle>
              <CardDescription className="text-xs">
                {backups.length} backup{backups.length !== 1 ? 's' : ''} stored
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">Date &amp; Time</TableHead>
                      <TableHead className="hidden sm:table-cell">Size</TableHead>
                      <TableHead className="hidden md:table-cell text-center">Posts</TableHead>
                      <TableHead className="hidden md:table-cell text-center">Categories</TableHead>
                      <TableHead className="hidden lg:table-cell text-center">Media</TableHead>
                      <TableHead className="hidden sm:table-cell">Trigger</TableHead>
                      <TableHead className="w-12 text-center">Status</TableHead>
                      <TableHead className="pr-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((backup, idx) => (
                      <TableRow key={backup.id} className="hover:bg-muted/30">
                        <TableCell className="pl-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{formatBackupDate(backup.createdAt)}</p>
                            {idx === 0 && (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 mt-0.5 font-normal">
                                Latest
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell py-3">
                          <span className="text-sm text-muted-foreground">{formatFileSize(backup.sizeBytes)}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-3 text-center">
                          <span className="text-sm text-muted-foreground">{backup.postCount}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-3 text-center">
                          <span className="text-sm text-muted-foreground">{backup.categoryCount}</span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell py-3 text-center">
                          <span className="text-sm text-muted-foreground">{backup.mediaCount}</span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell py-3">
                          <Badge variant="outline" className="text-[10px] capitalize">{backup.triggeredBy}</Badge>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <StatusIcon status={backup.status} />
                        </TableCell>
                        <TableCell className="py-3 pr-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[44px] gap-1.5 text-xs"
                            onClick={() => setRestoreTarget(backup)}
                            disabled={backup.status !== 'complete'}
                          >
                            <RotateCcw className="size-3.5" />
                            <span className="hidden sm:inline">Restore</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Restore confirmation dialog */}
      <AlertDialog open={!!restoreTarget} onOpenChange={(o) => !o && setRestoreTarget(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Restore from backup?
            </AlertDialogTitle>
          </AlertDialogHeader>

          {/* Body content — plain div, no asChild */}
          <div className="space-y-3 text-sm px-1">
            <p className="text-muted-foreground">
              You are about to restore your entire site from the backup created on{' '}
              <strong className="text-foreground">
                {restoreTarget ? formatBackupDate(restoreTarget.createdAt) : ''}
              </strong>.
            </p>

            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1.5">
              <p className="font-semibold text-destructive text-xs uppercase tracking-wide">
                Atomic Restore — This will:
              </p>
              <ul className="space-y-1 text-xs text-foreground/80 list-disc list-inside">
                <li><strong>Replace all current posts</strong> with the versions from the backup</li>
                <li><strong>Replace all categories</strong> and their hierarchy</li>
                <li><strong>Replace all site settings</strong> including author profile</li>
                <li>Any content created <strong>after this backup was made will be lost</strong></li>
              </ul>
            </div>

            <div className="rounded-lg border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/20 p-3">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-start gap-1.5">
                <CheckCircle2 className="size-3.5 mt-0.5 flex-shrink-0" />
                A <strong>safety backup of your current site</strong> will be created automatically
                before the restore begins, so you can recover if needed.
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestore}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, restore this backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
