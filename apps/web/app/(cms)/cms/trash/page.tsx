'use client'

import { useState, useEffect } from 'react'
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PageHeader } from '@/components/cms/page-header'
import { TypeBadge } from '@/components/cms/status-badge'
import { fetchPosts, updatePost, deletePost, getCloudinaryUrl } from '@/lib/cms-api'
import type { Post } from '@/lib/cms-api'

export default function TrashPage() {
  const [items, setItems] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false)

  useEffect(() => {
    fetchPosts({ includeDeleted: true, excludeContent: true })
      .then(data => {
        setItems(data.items.filter(p => p.deletedAt !== null))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleRestore(id: string) {
    // Clear deletedAt by updating the post status back to draft
    await updatePost(id, { status: 'draft' })
    setItems(prev => prev.filter(p => p.id !== id))
  }

  async function handlePermanentDelete(id: string) {
    await deletePost(id, true)
    setItems(prev => prev.filter(p => p.id !== id))
    setConfirmDelete(null)
  }

  async function handleEmptyTrash() {
    await Promise.all(items.map(p => deletePost(p.id, true)))
    setItems([])
    setConfirmEmptyTrash(false)
  }

  const target = items.find(p => p.id === confirmDelete)

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <PageHeader title="Trash" />
        <main className="flex-1 p-4 md:p-6">
          <div className="animate-pulse space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg" />)}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Trash"
        description={`${items.length} item${items.length !== 1 ? 's' : ''} in trash`}
        actions={
          items.length > 0 ? (
            <Button variant="destructive" size="sm" className="min-h-[44px] gap-2" onClick={() => setConfirmEmptyTrash(true)}>
              <Trash2 className="size-4" />
              Empty Trash
            </Button>
          ) : undefined
        }
      />

      <main className="flex-1 p-4 md:p-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <Trash2 className="size-8 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-medium text-foreground">Trash is empty</h2>
              <p className="text-sm text-muted-foreground mt-1">Items you delete will appear here for 30 days before permanent removal.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="size-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs leading-relaxed">
                Items in trash are automatically and permanently deleted after <strong>30 days</strong>. Restore items you want to keep.
              </p>
            </div>

            <div className="rounded-lg border border-border overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="hidden sm:table-cell w-14">Image</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden md:table-cell">Type</TableHead>
                      <TableHead className="hidden md:table-cell">Category</TableHead>
                      <TableHead className="text-right pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(post => {
                      const imageUrl = post.featuredImage
                        ? getCloudinaryUrl(post.featuredImage, { width: 80, height: 80, crop: 'fill' })
                        : ''
                      return (
                        <TableRow key={post.id} className="hover:bg-muted/30">
                          <TableCell className="hidden sm:table-cell py-3">
                            {imageUrl ? (
                              <div className="size-10 rounded-md bg-muted bg-cover bg-center opacity-60" style={{ backgroundImage: `url(${imageUrl})` }} />
                            ) : (
                              <div className="size-10 rounded-md bg-muted opacity-60" />
                            )}
                          </TableCell>
                          <TableCell className="py-3">
                            <p className="text-sm font-medium text-foreground/70 truncate max-w-[200px] md:max-w-xs line-through decoration-muted-foreground/50">
                              {post.title}
                            </p>
                          </TableCell>
                          <TableCell className="hidden md:table-cell py-3">
                            <TypeBadge type={post.type} />
                          </TableCell>
                          <TableCell className="hidden md:table-cell py-3">
                            <span className="text-sm text-muted-foreground">{post.categoryName || '—'}</span>
                          </TableCell>
                          <TableCell className="py-3 text-right pr-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="outline" size="sm" className="min-h-[44px] gap-2 text-xs" onClick={() => handleRestore(post.id)}>
                                <RotateCcw className="size-3.5" />
                                Restore
                              </Button>
                              <Button variant="destructive" size="sm" className="min-h-[44px] gap-2 text-xs" onClick={() => setConfirmDelete(post.id)}>
                                <Trash2 className="size-3.5" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Permanent delete single */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="size-5 text-destructive" />
              Permanently delete post?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>&ldquo;{target?.title}&rdquo;</strong> will be permanently removed and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && handlePermanentDelete(confirmDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty trash confirmation */}
      <AlertDialog open={confirmEmptyTrash} onOpenChange={setConfirmEmptyTrash}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="size-5 text-destructive" />
              Empty entire trash?
            </AlertDialogTitle>
            <AlertDialogDescription>
              All <strong>{items.length} item{items.length !== 1 ? 's' : ''}</strong> will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEmptyTrash} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Empty trash permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
