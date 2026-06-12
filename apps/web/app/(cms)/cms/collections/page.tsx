'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, Pencil, Trash2, BookOpen, ChevronRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/cms/page-header'
import { toast } from 'sonner'
import {
  fetchCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  fetchContentTypes,
  getCloudinaryUrl,
} from '@/lib/cms-api'
import type { CollectionItem } from '@/lib/cms-api'
import { CollectionForm, type CollectionFormData } from './collection-form'
import { ReviewsList } from './reviews-list'

function splitCsv(s: string): string[] {
  return s.split(',').map(x => x.trim()).filter(Boolean)
}

function buildPayload(data: CollectionFormData, typeKey: string) {
  return {
    name: data.name,
    typeKey,
    slug: data.slug,
    description: data.description,
    coverImage: data.coverImage,
    status: data.status,
    metadata: {
      altTitle: data.altTitle,
      originalTitle: data.originalTitle,
      genres: splitCsv(data.genres),
      tags: splitCsv(data.tags),
      translator: data.translator,
      author: data.author,
    },
  }
}

function CollectionsPageInner() {
  const searchParams = useSearchParams()
  const typeKey = searchParams.get('type') || 'novels'

  const [typeName, setTypeName] = useState('')
  const [collections, setCollections] = useState<CollectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [editTarget, setEditTarget] = useState<CollectionItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CollectionItem | null>(null)
  const [reviewsTarget, setReviewsTarget] = useState<CollectionItem | null>(null)

  useEffect(() => {
    fetchContentTypes()
      .then(types => setTypeName(types.find(t => t.key === typeKey)?.name ?? typeKey))
      .catch(() => setTypeName(typeKey))
  }, [typeKey])

  useEffect(() => {
    let cancelled = false
    fetchCollections(typeKey)
      .then(data => { if (!cancelled) setCollections(data) })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [typeKey])

  async function handleCreate(data: CollectionFormData) {
    try {
      const created = await createCollection(buildPayload(data, typeKey))
      setCollections(prev => [...prev, created])
      setShowNew(false)
      toast.success(`"${created.name}" created`)
    } catch {
      toast.error('Failed to create work')
    }
  }

  async function handleUpdate(data: CollectionFormData) {
    if (!editTarget) return
    try {
      const payload = buildPayload(data, typeKey)
      const updated = await updateCollection(editTarget.id, {
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        coverImage: payload.coverImage,
        status: payload.status,
        metadata: payload.metadata,
      })
      setCollections(prev => prev.map(c => c.id === editTarget.id ? updated : c))
      setEditTarget(null)
      toast.success(`"${updated.name}" updated`)
    } catch {
      toast.error('Failed to update work')
    }
  }

  async function handleDelete(col: CollectionItem) {
    try {
      await deleteCollection(col.id)
      setCollections(prev => prev.filter(c => c.id !== col.id))
      toast.success(`"${col.name}" deleted`)
    } catch {
      toast.error('Failed to delete work')
    }
    setDeleteTarget(null)
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <PageHeader title={`${typeName || typeKey} Works`} />
        <main className="flex-1 p-4 md:p-6">
          <div className="animate-pulse space-y-2 max-w-2xl">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl" />)}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={`${typeName} Works`}
        description={`${collections.length} work${collections.length !== 1 ? 's' : ''}`}
        actions={
          <Button size="sm" className="min-h-[44px] gap-2" onClick={() => setShowNew(true)}>
            <Plus className="size-4" />
            New Work
          </Button>
        }
      />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-2xl space-y-2">
          {collections.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <BookOpen className="size-10 text-muted-foreground/40" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">No works yet</p>
              <Button size="sm" onClick={() => setShowNew(true)} className="gap-2">
                <Plus className="size-4" />
                Create first work
              </Button>
            </div>
          )}

          {collections.map(col => (
            <div key={col.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 group hover:bg-muted/20 transition-colors min-h-[72px]">
              {/* Cover thumbnail */}
              {col.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getCloudinaryUrl(col.coverImage, { width: 48, height: 64, crop: 'fill' })}
                  alt={col.name}
                  className="size-12 rounded-md object-cover flex-shrink-0"
                />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-md bg-muted flex-shrink-0">
                  <BookOpen className="size-5 text-muted-foreground" aria-hidden="true" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{col.name}</span>
                  <Badge variant={col.status === 'completed' ? 'default' : 'secondary'} className="text-[10px] h-4 px-1.5 capitalize">
                    {col.status}
                  </Badge>
                  {col.rating > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-amber-500">
                      <Star className="size-3 fill-current" />
                      {col.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {col.chapterCount} chapter{col.chapterCount !== 1 ? 's' : ''} · {col.reviewsCount} review{col.reviewsCount !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Link href={`/cms/posts?type=${typeKey}&collection=${col.id}`}>
                  <Button variant="ghost" size="sm" className="min-h-[36px] text-xs gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                    Chapters
                    <ChevronRight className="size-3" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="min-h-[36px] text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" onClick={() => setReviewsTarget(col)}>
                  Reviews
                </Button>
                <Button variant="ghost" size="icon" className="size-9 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" onClick={() => setEditTarget(col)} aria-label={`Edit ${col.name}`}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="size-9 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" onClick={() => setDeleteTarget(col)} aria-label={`Delete ${col.name}`}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* New / Edit Sheet */}
      <Sheet open={showNew || !!editTarget} onOpenChange={open => { if (!open) { setShowNew(false); setEditTarget(null) } }}>
        <SheetContent className="w-[360px] sm:w-[420px] p-0">
          <SheetHeader className="px-4 pt-4 pb-0">
            <SheetTitle>{editTarget ? 'Edit Work' : 'New Work'}</SheetTitle>
            <SheetDescription className="text-xs">
              {editTarget ? 'Update the work details.' : `Create a new ${typeName} work.`}
            </SheetDescription>
          </SheetHeader>
          <CollectionForm
            initial={editTarget ?? undefined}
            onSave={editTarget ? handleUpdate : handleCreate}
            onCancel={() => { setShowNew(false); setEditTarget(null) }}
          />
        </SheetContent>
      </Sheet>

      {/* Reviews Sheet */}
      <Sheet open={!!reviewsTarget} onOpenChange={open => { if (!open) setReviewsTarget(null) }}>
        <SheetContent className="w-[360px] sm:w-[420px]">
          <SheetHeader>
            <SheetTitle>Reviews — {reviewsTarget?.name}</SheetTitle>
            <SheetDescription className="text-xs">Moderate reader reviews.</SheetDescription>
          </SheetHeader>
          <Separator className="my-3" />
          {reviewsTarget && <ReviewsList collectionId={reviewsTarget.id} />}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete work?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong> will be deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && handleDelete(deleteTarget)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function CollectionsPage() {
  return (
    <Suspense>
      <CollectionsPageInner />
    </Suspense>
  )
}
