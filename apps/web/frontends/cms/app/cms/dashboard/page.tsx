'use client'

import Link from 'next/link'
import {
  PlusCircle,
  Eye,
  FileText,
  ArrowRight,
  CalendarDays,
  Pencil,
  Globe,
  ImageIcon,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/cms/status-badge'
import {
  MOCK_POSTS,
  MOCK_ANALYTICS,
  formatDate,
  formatViewCount,
} from '@/lib/mock-data'

// Mini bar chart for views
function ViewsBarChart({ data }: { data: { date: string; views: number }[] }) {
  const max = Math.max(...data.map(d => d.views))
  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full rounded-sm bg-accent/80 transition-all hover:bg-accent"
            style={{ height: `${(d.views / max) * 64}px` }}
            title={`${d.date}: ${d.views.toLocaleString()} views`}
          />
        </div>
      ))}
    </div>
  )
}

// Mini calendar widget
function MiniCalendar() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = today.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  // Build scheduled/published days from mock data
  const scheduledDays = new Set<number>()
  const publishedDays = new Set<number>()
  MOCK_POSTS.forEach(p => {
    if (p.status === 'trash') return
    const dateStr = p.publishedAt ?? p.scheduledAt
    if (!dateStr) return
    const d = new Date(dateStr)
    if (d.getFullYear() === year && d.getMonth() === month) {
      if (p.status === 'scheduled') scheduledDays.add(d.getDate())
      if (p.status === 'published') publishedDays.add(d.getDate())
    }
  })

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-3">{monthName}</p>
      <div className="grid grid-cols-7 gap-0.5">
        {dayNames.map(d => (
          <div key={d} className="text-center text-[10px] text-muted-foreground/60 font-medium py-0.5">{d}</div>
        ))}
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />
          const isToday = day === today.getDate()
          const isScheduled = scheduledDays.has(day)
          const isPublished = publishedDays.has(day)
          return (
            <div
              key={idx}
              className={`relative flex flex-col items-center justify-center rounded-md aspect-square text-[11px] font-medium transition-colors
                ${isToday ? 'bg-accent text-accent-foreground' : 'hover:bg-muted text-foreground'}
              `}
            >
              {day}
              {(isScheduled || isPublished) && (
                <span className={`absolute bottom-0.5 size-1 rounded-full ${isScheduled ? 'bg-blue-400' : 'bg-emerald-400'}`} />
              )}
            </div>
          )
        })}
      </div>
      <div className="flex gap-3 mt-3">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-400 inline-block" />Published
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="size-2 rounded-full bg-blue-400 inline-block" />Scheduled
        </div>
      </div>
    </div>
  )
}

const quickActions = [
  { href: '/cms/posts/new', label: 'New Post', icon: PlusCircle },
  { href: 'https://inkwell.example.com', label: 'View Site', icon: Globe },
]

export default function DashboardPage() {
  const recentPosts = MOCK_POSTS.filter(p => p.status !== 'trash').slice(0, 5)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Quick actions sleek top menu */}
      <div className="bg-foreground text-background">
        <div className="flex items-center gap-1 px-4 md:px-6 h-8 overflow-x-auto">
          {quickActions.map((action) => {
            const button = (
              <button
                className="flex items-center gap-1.5 text-[11px] font-medium text-background/80 hover:text-background h-6 px-2 whitespace-nowrap rounded-md hover:bg-background/20 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-background/50"
              >
                <action.icon className="size-3" />
                {action.label}
              </button>
            )
            return (
              <div key={action.href}>
                {action.href.startsWith('http') ? (
                  <a href={action.href} target="_blank" rel="noopener noreferrer">
                    {button}
                  </a>
                ) : (
                  <Link href={action.href}>
                    {button}
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Page header with greeting */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4 px-4 md:px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Good morning, Sarah. Here's what's happening today.</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-4">

        {/* Recent Posts — top priority */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Posts</CardTitle>
              <Link href="/cms/posts">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground gap-1 h-8 min-h-0"
                >
                  View all <ArrowRight className="size-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/cms/posts/${post.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group min-h-[60px]"
                >
                  <div
                    className="size-10 rounded-md bg-muted flex-shrink-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${post.coverImage})` }}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-accent-foreground leading-snug">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(post.publishedAt ?? post.scheduledAt ?? post.updatedAt)} · {formatViewCount(post.views)} views
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={post.status} />
                    <Pencil className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Views + Calendar — 50/50 split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Weekly views chart */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Views This Week</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Daily page views over the last 7 days</CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {MOCK_ANALYTICS.viewsByDay.reduce((s, d) => s + d.views, 0).toLocaleString()} total
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <ViewsBarChart data={MOCK_ANALYTICS.viewsByDay} />
              <div className="flex justify-between mt-2">
                {MOCK_ANALYTICS.viewsByDay.map((d) => (
                  <span key={d.date} className="text-[10px] text-muted-foreground flex-1 text-center">{d.date}</span>
                ))}
              </div>
              <Separator className="my-3" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total Views</p>
                  <p className="text-lg font-semibold">{MOCK_ANALYTICS.totalViews.value.toLocaleString()}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">+{MOCK_ANALYTICS.totalViews.change}% this week</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Subscribers</p>
                  <p className="text-lg font-semibold">{MOCK_ANALYTICS.subscribers.value.toLocaleString()}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">+{MOCK_ANALYTICS.subscribers.change}% this week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Calendar */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Content Calendar</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  render={<Link href="/cms/calendar" aria-label="View full calendar" />}
                >
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <MiniCalendar />
            </CardContent>
          </Card>
        </div>

        {/* Content breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Content Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Published', count: 4, color: 'bg-emerald-500', pct: 50 },
                { label: 'Drafts', count: 2, color: 'bg-muted-foreground', pct: 25 },
                { label: 'Scheduled', count: 2, color: 'bg-blue-400', pct: 25 },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className={`size-2 rounded-full ${item.color}`} />
                      {item.label}
                    </span>
                    <span className="font-medium text-foreground">{item.count}</span>
                  </div>
                  <Progress value={item.pct} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
