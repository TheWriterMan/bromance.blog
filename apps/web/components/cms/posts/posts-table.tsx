'use client'

import { Eye, Clock, MoreHorizontal, Pencil, Copy, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge, TypeBadge } from '@/components/cms/status-badge'
import { getCloudinaryUrl } from '@/lib/cms-api'
import type { Post } from '@/lib/cms-api'

interface PostsTableProps {
  posts: Post[]
  selected: Set<string>
  onSelect: (selected: Set<string>) => void
  onTrash: (id: string) => void
  onNavigate: (id: string) => void
}

function formatViewCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function PostsTable({ posts, selected, onSelect, onTrash, onNavigate }: PostsTableProps) {
  const allSelected = posts.length > 0 && selected.size === posts.length
  const someSelected = selected.size > 0 && !allSelected

  function toggleSelect(id: string) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    onSelect(next)
  }

  function toggleAll() {
    if (allSelected) {
      onSelect(new Set())
    } else {
      onSelect(new Set(posts.map(p => p.id)))
    }
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="w-12 pl-4">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all posts"
                  className="size-5"
                />
              </TableHead>
              <TableHead className="w-14 hidden sm:table-cell">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden lg:table-cell">Category</TableHead>
              <TableHead className="hidden lg:table-cell">Date</TableHead>
              <TableHead className="hidden sm:table-cell text-right">
                <div className="flex items-center justify-end gap-1">
                  <Eye className="size-3" /> Views
                </div>
              </TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16 text-muted-foreground text-sm">
                  No posts found
                </TableCell>
              </TableRow>
            )}
            {posts.map((post) => {
              const imageUrl = post.featuredImage
                ? getCloudinaryUrl(post.featuredImage, { width: 80, height: 80, crop: 'fill' })
                : ''

              return (
                <TableRow
                  key={post.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors group"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('[data-no-nav]')) return
                    onNavigate(post.id)
                  }}
                >
                  <TableCell className="pl-4 py-3" data-no-nav>
                    <Checkbox
                      checked={selected.has(post.id)}
                      onCheckedChange={() => toggleSelect(post.id)}
                      aria-label={`Select ${post.title}`}
                      className="size-5"
                      onClick={e => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="py-3 hidden sm:table-cell">
                    {imageUrl ? (
                      <div
                        className="size-10 rounded-md bg-muted bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${imageUrl})` }}
                        role="img"
                        aria-label={`Cover image for ${post.title}`}
                      />
                    ) : (
                      <div className="size-10 rounded-md bg-muted flex-shrink-0" />
                    )}
                  </TableCell>
                  <TableCell className="py-3 max-w-[200px] md:max-w-xs">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                      <div className="flex items-center gap-1.5 md:hidden">
                        <StatusBadge status={post.status} />
                      </div>
                      <p className="text-xs text-muted-foreground hidden lg:block truncate">{post.summary?.slice(0, 60)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 hidden md:table-cell">
                    <StatusBadge status={post.status} />
                  </TableCell>
                  <TableCell className="py-3 hidden md:table-cell">
                    <TypeBadge type={post.type} />
                  </TableCell>
                  <TableCell className="py-3 hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">{post.categoryName || '—'}</span>
                  </TableCell>
                  <TableCell className="py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" aria-hidden="true" />
                      {formatDate(post.publishedAt ?? post.updatedAt)}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 hidden sm:table-cell text-right">
                    <span className="text-sm text-muted-foreground">{formatViewCount(post.views)}</span>
                  </TableCell>
                  <TableCell className="py-3" data-no-nav>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex size-9 items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-muted"
                        aria-label="Post options"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); onNavigate(post.id) }}
                          className="gap-2"
                        >
                          <Pencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); onTrash(post.id) }}
                          className="gap-2"
                          variant="destructive"
                        >
                          <Trash2 className="size-4" />
                          Move to trash
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
