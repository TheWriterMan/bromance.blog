'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  PlusCircle,
  Search,
  Trash2,
  Eye,
  Clock,
  MoreHorizontal,
  Pencil,
  Copy,
  ArrowUpDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/cms/page-header'
import { StatusBadge } from '@/components/cms/status-badge'
import { TypeBadge } from '@/components/cms/status-badge'
import { MOCK_POSTS, formatDate, formatViewCount, type PostStatus } from '@/lib/mock-data'
import { toast } from 'sonner'

type TabValue = 'all' | PostStatus

const TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
  { value: 'scheduled', label: 'Scheduled' },
]

export default function PostsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<TabValue>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [posts, setPosts] = useState(MOCK_POSTS.filter(p => p.status !== 'trash'))
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [sortAsc, setSortAsc] = useState(false)

  const filtered = useMemo(() => {
    let result = posts
    if (tab !== 'all') result = result.filter(p => p.status === tab)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      )
    }
    return result.sort((a, b) => {
      const da = new Date(a.updatedAt).getTime()
      const db = new Date(b.updatedAt).getTime()
      return sortAsc ? da - db : db - da
    })
  }, [posts, tab, search, sortAsc])

  const tabCounts: Record<TabValue, number> = {
    all: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    draft: posts.filter(p => p.status === 'draft').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    trash: 0,
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(p => p.id)))
    }
  }

  function handleBulkTrash() {
    setPosts(prev =>
      prev.map(p => selected.has(p.id) ? { ...p, status: 'trash' as PostStatus } : p)
        .filter(p => p.status !== 'trash')
    )
    const count = selected.size
    setSelected(new Set())
    setShowBulkDelete(false)
    toast.success(`${count} post${count > 1 ? 's' : ''} moved to trash`)
  }

  function handleTrashOne(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id))
    toast.success('Post moved to trash')
  }

  function handleDuplicate(_id: string) {
    toast.success('Post duplicated as draft')
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length
  const someSelected = selected.size > 0 && !allSelected

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Posts"
        description={`${tabCounts.all} total posts`}
        actions={
          <Link href="/cms/posts/new">
            <Button size="sm" className="min-h-[44px] gap-2">
              <PlusCircle className="size-4" data-icon="inline-start" />
              New Post
            </Button>
          </Link>
        }
      />

      <main className="flex-1 p-4 md:p-6 space-y-4">
        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <Tabs value={tab} onValueChange={(v) => { setTab(v as TabValue); setSelected(new Set()) }}>
            <TabsList className="h-11">
              {TABS.map(t => (
                <TabsTrigger key={t.value} value={t.value} className="min-h-[38px] gap-1.5 px-3">
                  {t.label}
                  <Badge variant="secondary" className="text-[10px] min-w-[18px] h-4 px-1">
                    {tabCounts[t.value]}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-11"
              aria-label="Search posts"
            />
          </div>

          {selected.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="min-h-[44px] gap-2"
              onClick={() => setShowBulkDelete(true)}
            >
              <Trash2 className="size-4" data-icon="inline-start" />
              Trash {selected.size} selected
            </Button>
          )}
        </div>

        {/* Table */}
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
                  <TableHead>
                    <button
                      className="flex items-center gap-1 text-xs font-medium hover:text-foreground transition-colors"
                      onClick={() => setSortAsc(p => !p)}
                    >
                      Title <ArrowUpDown className="size-3" />
                    </button>
                  </TableHead>
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
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16 text-muted-foreground text-sm">
                      No posts found
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((post) => (
                  <TableRow
                    key={post.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors group"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('[data-no-nav]')) return
                      router.push(`/cms/posts/${post.id}`)
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
                      <div
                        className="size-10 rounded-md bg-muted bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${post.coverImage})` }}
                        role="img"
                        aria-label={`Cover image for ${post.title}`}
                      />
                    </TableCell>
                    <TableCell className="py-3 max-w-[200px] md:max-w-xs">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                        <div className="flex items-center gap-1.5 md:hidden">
                          <StatusBadge status={post.status} />
                        </div>
                        <p className="text-xs text-muted-foreground hidden lg:block">{post.excerpt.slice(0, 60)}…</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 hidden md:table-cell">
                      <StatusBadge status={post.status} />
                    </TableCell>
                    <TableCell className="py-3 hidden md:table-cell">
                      <TypeBadge type={post.type} />
                    </TableCell>
                    <TableCell className="py-3 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">{post.category}</span>
                    </TableCell>
                    <TableCell className="py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" aria-hidden="true" />
                        {formatDate(post.publishedAt ?? post.scheduledAt ?? post.updatedAt)}
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
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/cms/posts/${post.id}`)
                            }}
                            className="gap-2"
                          >
                            <Pencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); handleDuplicate(post.id) }}
                            className="gap-2"
                          >
                            <Copy className="size-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); handleTrashOne(post.id) }}
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
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      {/* Bulk delete confirmation */}
      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to trash?</AlertDialogTitle>
            <AlertDialogDescription>
              {selected.size} post{selected.size > 1 ? 's' : ''} will be moved to trash. You can restore them from the Trash page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkTrash} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Move to trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
