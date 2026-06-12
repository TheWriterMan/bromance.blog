'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, Globe, ArrowRight, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/cms/page-header'
import { StatusBadge } from '@/components/cms/status-badge'
import { fetchAnalytics, fetchPosts, getCloudinaryUrl } from '@/lib/cms-api'
import type { Analytics, Post } from '@/lib/cms-api'

function RecentPostRow({ post }: { post: Post }) {
  const imageUrl = post.featuredImage
    ? getCloudinaryUrl(post.featuredImage, { width: 80, height: 80, crop: 'fill' })
    : ''

  const date = post.publishedAt ?? post.updatedAt
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : ''

  return (
    <Link
      href={`/cms/posts/${post.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group min-h-[60px]"
    >
      {imageUrl && (
        <div
          className="size-10 rounded-md bg-muted flex-shrink-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
          aria-hidden="true"
        />
      )}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-accent-foreground leading-snug">
          {post.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {formattedDate} · {post.views.toLocaleString()} views
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusBadge status={post.status} />
        <Pencil className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchAnalytics(),
      fetchPosts({ limit: 5, excludeContent: true }),
    ])
      .then(([analyticsData, postsData]) => {
        setAnalytics(analyticsData)
        setRecentPosts(postsData.items)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <PageHeader title="Dashboard" />
        <main className="flex-1 p-4 md:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded-lg" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-48 bg-muted rounded-lg" />
              <div className="h-48 bg-muted rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Quick actions bar */}
      <div className="bg-foreground text-background">
        <div className="flex items-center gap-1 px-4 md:px-6 h-8 overflow-x-auto">
          <Link href="/cms/posts/new">
            <button className="flex items-center gap-1.5 text-[11px] font-medium text-background/80 hover:text-background h-6 px-2 whitespace-nowrap rounded-md hover:bg-background/20 transition-colors flex-shrink-0">
              <PlusCircle className="size-3" />
              New Post
            </button>
          </Link>
          <a href="/" target="_blank" rel="noopener noreferrer">
            <button className="flex items-center gap-1.5 text-[11px] font-medium text-background/80 hover:text-background h-6 px-2 whitespace-nowrap rounded-md hover:bg-background/20 transition-colors flex-shrink-0">
              <Globe className="size-3" />
              View Site
            </button>
          </a>
        </div>
      </div>

      <PageHeader title="Dashboard" description="Here's what's happening today." />

      <main className="flex-1 p-4 md:p-6 space-y-4">
        {/* Recent Posts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Posts</CardTitle>
              <Link href="/cms/posts">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1 h-8 min-h-0">
                  View all <ArrowRight className="size-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentPosts.map(post => (
                <RecentPostRow key={post.id} post={post} />
              ))}
              {recentPosts.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">No posts yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Views + Content breakdown */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Posts by Views */}
            <Card>
              <CardHeader className="pb-3">
                <div>
                  <CardTitle className="text-sm font-semibold">Top Posts by Views</CardTitle>
                  <CardDescription className="text-xs mt-0.5">All-time views per post</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-2">
                  {(analytics.popularPosts ?? []).slice(0, 5).map((post, i) => (
                    <div key={post.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground w-4 text-right flex-shrink-0">{i + 1}.</span>
                      <span className="flex-1 truncate text-foreground">{post.title}</span>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">{post.views.toLocaleString()}</Badge>
                    </div>
                  ))}
                  {(analytics.popularPosts ?? []).length === 0 && (
                    <p className="text-xs text-muted-foreground">No data yet</p>
                  )}
                </div>
                <Separator className="my-3" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Views</p>
                    <p className="text-lg font-semibold">{analytics.totalViews.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Read Time</p>
                    <p className="text-lg font-semibold">{analytics.avgReadTime} min</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Content Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Published', count: analytics.publishedCount, color: 'bg-emerald-500', pct: analytics.totalPosts > 0 ? Math.round(analytics.publishedCount / analytics.totalPosts * 100) : 0 },
                    { label: 'Drafts', count: analytics.draftsCount, color: 'bg-muted-foreground', pct: analytics.totalPosts > 0 ? Math.round(analytics.draftsCount / analytics.totalPosts * 100) : 0 },
                    { label: 'Scheduled', count: analytics.scheduledCount, color: 'bg-blue-400', pct: analytics.totalPosts > 0 ? Math.round(analytics.scheduledCount / analytics.totalPosts * 100) : 0 },
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
                  <Separator />
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Categories</p>
                      <p className="font-semibold text-foreground">{analytics.totalCategories}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tags</p>
                      <p className="font-semibold text-foreground">{analytics.totalTags}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
