'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, CalendarDays, Columns3, PlusCircle, Clock, Tag, ArrowRight, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { PageHeader } from '@/components/cms/page-header'
import { StatusBadge } from '@/components/cms/status-badge'
import { MOCK_POSTS, formatDate, type Post, type PostStatus } from '@/lib/mock-data'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const STATUS_COLORS: Record<PostStatus, string> = {
  published: 'bg-emerald-500/90 text-white hover:bg-emerald-500',
  scheduled: 'bg-blue-500/90 text-white hover:bg-blue-500',
  draft: 'bg-muted-foreground/60 text-white hover:bg-muted-foreground/80',
  trash: 'bg-destructive/70 text-white hover:bg-destructive/90',
}

function getPostsForDay(posts: Post[], year: number, month: number, day: number): Post[] {
  return posts.filter(post => {
    const dateStr = post.publishedAt ?? post.scheduledAt
    if (!dateStr) return false
    const d = new Date(dateStr)
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
  })
}

// ─── Post Detail Popover ────────────────────────────────────────────────────

function PostPopover({ post, children }: { post: Post; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        aria-label={`View details for ${post.title}`}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-72 p-0 overflow-hidden" sideOffset={6}>
        {post.coverImage && (
          <div
            className="w-full h-28 bg-cover bg-center"
            style={{ backgroundImage: `url(${post.coverImage})` }}
            aria-hidden="true"
          />
        )}
        <div className="p-3 space-y-2.5">
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-foreground leading-snug">{post.title}</p>
              <StatusBadge status={post.status} />
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{post.excerpt}</p>
          </div>
          <Separator />
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Tag className="size-3 flex-shrink-0" />
              <span>{post.category}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-3 flex-shrink-0" />
              <span>
                {post.publishedAt
                  ? `Published ${formatDate(post.publishedAt)}`
                  : post.scheduledAt
                    ? `Scheduled for ${formatDate(post.scheduledAt)}`
                    : 'No date set'}
              </span>
            </div>
            {post.views > 0 && (
              <div className="flex items-center gap-1.5">
                <Eye className="size-3 flex-shrink-0" />
                <span>{post.views.toLocaleString()} views</span>
              </div>
            )}
          </div>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, 4).map(t => (
                <Badge key={t} variant="secondary" className="text-[10px] px-1.5 h-4">{t}</Badge>
              ))}
            </div>
          )}
          <Link href={`/cms/posts/${post.id}`}>
            <Button
              size="sm"
              className="w-full min-h-[36px] gap-1.5 text-xs"
            >
              Edit Post <ArrowRight className="size-3" />
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── Calendar View ─────────────────────────────────────────────────────────────

function CalendarView({ posts, year, month }: { posts: Post[]; year: number; month: number }) {
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_NAMES.map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 border-l border-border">
        {cells.map((day, idx) => {
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const dayPosts = day ? getPostsForDay(posts, year, month, day) : []

          return (
            <div
              key={idx}
              className={`border-r border-b border-border min-h-[80px] md:min-h-[110px] p-1 md:p-2 ${!day ? 'bg-muted/20' : 'hover:bg-muted/10 transition-colors'}`}
            >
              {day && (
                <>
                  <div className={`flex size-6 items-center justify-center rounded-full text-xs font-medium mb-1 ${isToday ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayPosts.slice(0, 2).map(post => (
                      <PostPopover key={post.id} post={post}>
                        <div className={`${STATUS_COLORS[post.status]} text-xs font-medium px-2 py-1 rounded truncate leading-snug cursor-pointer transition-colors`}>
                          <span className="hidden md:inline">{post.title}</span>
                          <span className="md:hidden">{post.title.split(' ').slice(0, 2).join(' ')}</span>
                        </div>
                      </PostPopover>
                    ))}
                    {dayPosts.length > 2 && (
                      <div className="text-[10px] text-muted-foreground px-1 font-medium">
                        +{dayPosts.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Kanban View ──────────────────────────────────────────────────────────────

const KANBAN_COLUMNS: { status: PostStatus; label: string; color: string }[] = [
  { status: 'draft', label: 'Drafts', color: 'bg-muted/50 border-border' },
  { status: 'scheduled', label: 'Scheduled', color: 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900' },
  { status: 'published', label: 'Published', color: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900' },
]

function KanbanView({ posts }: { posts: Post[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 md:p-6">
      {KANBAN_COLUMNS.map(col => {
        const colPosts = posts.filter(p => p.status === col.status)
        return (
          <div key={col.status} className={`flex flex-col rounded-xl border ${col.color}`}>
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-inherit">
              <div className="flex items-center gap-2">
                <StatusBadge status={col.status} />
                <span className="text-xs font-medium text-muted-foreground">{colPosts.length}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                render={<Link href="/cms/posts/new" aria-label={`New ${col.status} post`} />}
              >
                <PlusCircle className="size-3.5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 max-h-[60vh]">
              <div className="p-2 space-y-2">
                {colPosts.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No {col.label.toLowerCase()}
                  </div>
                )}
                {colPosts.map(post => (
                  <Card key={post.id} className="group hover:shadow-md transition-shadow relative overflow-hidden border-border/60">
                    <Link href={`/cms/posts/${post.id}`}>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute top-2 right-2 size-7 z-10 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100"
                        aria-label={`Edit ${post.title}`}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </Link>
                    {post.coverImage && (
                      <div
                        className="w-full h-28 bg-cover bg-center"
                        style={{ backgroundImage: `url(${post.coverImage})` }}
                        aria-hidden="true"
                      />
                    )}
                    <CardContent className="p-3 space-y-2.5">
                      <div className="space-y-1 pr-6">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground leading-snug">{post.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{post.excerpt}</p>
                      </div>
                      <Separator />
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Tag className="size-3 flex-shrink-0" />
                          <span>{post.category}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3 flex-shrink-0" />
                          <span>
                            {post.publishedAt
                              ? `Published ${formatDate(post.publishedAt)}`
                              : post.scheduledAt
                                ? `Scheduled for ${formatDate(post.scheduledAt)}`
                                : 'No date set'}
                          </span>
                        </div>
                        {post.views > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Eye className="size-3 flex-shrink-0" />
                            <span>{post.views.toLocaleString()} views</span>
                          </div>
                        )}
                      </div>
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 4).map(t => (
                            <Badge key={t} variant="secondary" className="text-[10px] px-1.5 h-4">{t}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [view, setView] = useState<'calendar' | 'kanban'>('calendar')

  const activePosts = MOCK_POSTS.filter(p => p.status !== 'trash')

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Content Calendar"
        description="Plan and schedule your content"
        actions={
          <Link href="/cms/posts/new">
            <Button size="sm" className="min-h-[44px] gap-2">
              <PlusCircle data-icon="inline-start" />
              New Post
            </Button>
          </Link>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
        {view === 'calendar' ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth} className="size-9" aria-label="Previous month">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {MONTH_NAMES[month]} {year}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth} className="size-9" aria-label="Next month">
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()) }}
              className="text-xs text-muted-foreground h-9 px-3 hidden sm:flex"
            >
              Today
            </Button>
          </div>
        ) : (
          <h2 className="text-sm font-medium text-muted-foreground">All Posts by Status</h2>
        )}

        <div className="flex items-center gap-2">
          {view === 'calendar' && (
            <div className="hidden sm:flex items-center gap-3 mr-2">
              {[
                { label: 'Published', color: 'bg-emerald-500' },
                { label: 'Scheduled', color: 'bg-blue-500' },
                { label: 'Draft', color: 'bg-muted-foreground/50' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`size-2 rounded-full ${l.color}`} />
                  {l.label}
                </div>
              ))}
            </div>
          )}

          <Tabs value={view} onValueChange={v => setView(v as 'calendar' | 'kanban')}>
            <TabsList className="h-9">
              <TabsTrigger value="calendar" className="gap-1.5 px-3 h-8">
                <CalendarDays className="size-3.5" />
                <span className="hidden sm:inline">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="gap-1.5 px-3 h-8">
                <Columns3 className="size-3.5" />
                <span className="hidden sm:inline">Kanban</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {view === 'calendar' ? (
          <CalendarView posts={activePosts} year={year} month={month} />
        ) : (
          <KanbanView posts={activePosts} />
        )}
      </div>
    </div>
  )
}
