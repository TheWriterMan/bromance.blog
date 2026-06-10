'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PostStatus, PostType } from '@/lib/mock-data'

interface StatusBadgeProps {
  status: PostStatus
  className?: string
}

const statusConfig: Record<PostStatus, { label: string; className: string }> = {
  published: {
    label: 'Published',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  },
  draft: {
    label: 'Draft',
    className: 'bg-secondary text-muted-foreground border-border',
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  },
  trash: {
    label: 'Trash',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium capitalize', config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

const typeConfig: Record<PostType, { label: string; className: string }> = {
  article: {
    label: 'Article',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  tutorial: {
    label: 'Tutorial',
    className: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  },
  review: {
    label: 'Review',
    className: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800',
  },
  opinion: {
    label: 'Opinion',
    className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800',
  },
}

interface TypeBadgeProps {
  type: PostType
  className?: string
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const config = typeConfig[type]
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium capitalize', config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
