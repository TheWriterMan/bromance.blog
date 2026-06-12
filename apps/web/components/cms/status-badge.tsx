'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PostStatus, PostType } from '@/lib/cms-api'

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

const typeConfig: Record<string, { label: string; className: string }> = {
  article: {
    label: 'Article',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  novels: {
    label: 'Novel',
    className: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800',
  },
}

const FALLBACK_TYPE_CLASS = 'bg-secondary text-muted-foreground border-border'

interface TypeBadgeProps {
  type: PostType
  className?: string
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  // Types are data-driven (content_types table), so any unknown key must render
  // gracefully instead of crashing on an undefined config.
  const config = typeConfig[type] ?? {
    label: type ? String(type) : 'Post',
    className: FALLBACK_TYPE_CLASS,
  }
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium capitalize', config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
