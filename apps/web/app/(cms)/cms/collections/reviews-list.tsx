'use client'

import { useState, useEffect } from 'react'
import { Trash2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { toast } from 'sonner'
import { fetchCollectionReviews, deleteReview } from '@/lib/cms-api'
import type { CollectionReview } from '@/lib/cms-api'

interface Props {
  collectionId: string
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${rating} stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`size-3 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
      ))}
    </span>
  )
}

export function ReviewsList({ collectionId }: Props) {
  const [reviews, setReviews] = useState<CollectionReview[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<CollectionReview | null>(null)

  useEffect(() => {
    fetchCollectionReviews(collectionId)
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [collectionId])

  async function handleDelete(review: CollectionReview) {
    try {
      await deleteReview(collectionId, review.id)
      setReviews(prev => prev.filter(r => r.id !== review.id))
      toast.success('Review deleted')
    } catch {
      toast.error('Failed to delete review')
    }
    setDeleteTarget(null)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg" />)}
      </div>
    )
  }

  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No reviews yet.</p>
  }

  return (
    <>
      <div className="space-y-2">
        {reviews.map(review => (
          <div key={review.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 group">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{review.authorName ?? 'Anonymous'}</span>
                <Stars rating={review.rating} />
                <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{review.content}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex-shrink-0"
              onClick={() => setDeleteTarget(review)}
              aria-label="Delete review"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete review?</AlertDialogTitle>
            <AlertDialogDescription>This review will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
