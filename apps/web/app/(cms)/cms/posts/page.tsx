'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PlusCircle, Search, Trash2, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { PageHeader } from '@/components/cms/page-header'
import { PostsTable } from '@/components/cms/posts/posts-table'
import { fetchPosts, fetchPostCounts, deletePost } from '@/lib/cms-api'
import type { Post, PostCounts } from '@/lib/cms-api'

type TabValue = 'all' | 'published' | 'draft' | 'scheduled'

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
  const [posts, setPosts] = useState<Post[]>([])
  const [counts, setCounts] = useState<PostCounts>({ all: 0, published: 0, draft: 0, scheduled: 0 })
  const [loading, setLoading] = useState(true)
  const [showBulkDelete, setShowBulkDelete] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchPosts({ excludeContent: true }),
      fetchPostCounts(),
    ])
      .then(([postsData, countsData]) => {
        setPosts(postsData.items)
        setCounts(countsData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = posts
    if (tab !== 'all') result = result.filter(p => p.status === tab)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.categoryName || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [posts, tab, search])

  async function handleBulkTrash() {
    const ids = Array.from(selected)
    await Promise.all(ids.map(id => deletePost(id)))
    setPosts(prev => prev.filter(p => !selected.has(p.id)))
    setCounts(prev => ({ ...prev, all: prev.all - ids.length }))
    setSelected(new Set())
    setShowBulkDelete(false)
  }

  async function handleTrashOne(id: string) {
    await deletePost(id)
    setPosts(prev => prev.filter(p => p.id !== id))
    setCounts(prev => ({ ...prev, all: prev.all - 1 }))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Posts"
        description={`${counts.all} total posts`}
        actions={
          <Link href="/cms/posts/new">
            <Button size="sm" className="min-h-[44px] gap-2">
              <PlusCircle className="size-4" />
              New Post
            </Button>
          </Link>
        }
      />

      <main className="flex-1 p-4 md:p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <Tabs value={tab} onValueChange={(v) => { setTab(v as TabValue); setSelected(new Set()) }}>
            <TabsList className="h-11">
              {TABS.map(t => (
                <TabsTrigger key={t.value} value={t.value} className="min-h-[38px] gap-1.5 px-3">
                  {t.label}
                  <Badge variant="secondary" className="text-[10px] min-w-[18px] h-4 px-1">
                    {counts[t.value]}
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
              <Trash2 className="size-4" />
              Trash {selected.size} selected
            </Button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        ) : (
          <PostsTable
            posts={filtered}
            selected={selected}
            onSelect={setSelected}
            onTrash={handleTrashOne}
            onNavigate={(id) => router.push(`/cms/posts/${id}`)}
          />
        )}
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
