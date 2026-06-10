'use client'

import { use, useState, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Eye,
  Globe,
  Clock,
  Hash,
  ImageIcon,
  X,
  ChevronDown,
  Upload,
  Link2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { StatusBadge } from '@/components/cms/status-badge'
import { MOCK_POSTS, MOCK_CATEGORIES, formatDate, type PostStatus } from '@/lib/mock-data'
import { toast } from 'sonner'
import { SidebarTrigger } from '@/components/ui/sidebar'

export default function PostEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const source = id === 'new' ? null : MOCK_POSTS.find(p => p.id === id)

  // Post Details (top block)
  const [title, setTitle] = useState(source?.title ?? '')
  const [slug, setSlug] = useState(source?.slug ?? '')
  const [category, setCategory] = useState(source?.categoryId ?? '')
  const [tags, setTags] = useState<string[]>(source?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [coverImage, setCoverImage] = useState(source?.coverImage ?? '')

  // Body
  const [body, setBody] = useState(source
    ? `# ${source.title}\n\n${source.excerpt}\n\nThis is where the full post content would appear. The editor supports rich text or markdown in production.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`
    : '')

  // Sidebar settings
  const [status, setStatus] = useState<PostStatus>(source?.status ?? 'draft')
  const [featured, setFeatured] = useState(source?.featured ?? false)
  const [excerpt, setExcerpt] = useState(source?.excerpt ?? '')
  const [metaTitle, setMetaTitle] = useState(source?.title ?? '')
  const [metaDescription, setMetaDescription] = useState(source?.excerpt ?? '')
  const [saving, setSaving] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  // Auto-generate slug from title
  function handleTitleChange(val: string) {
    setTitle(val)
    if (!source) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
    }
  }

  async function handleSave() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success('Post saved successfully')
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const t = tagInput.trim().replace(',', '')
      if (t && !tags.includes(t)) setTags(prev => [...prev, t])
      setTagInput('')
    }
  }

  function removeTag(t: string) {
    setTags(prev => prev.filter(x => x !== t))
  }

  function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setCoverImage(url)
    }
  }

  const rootCategories = MOCK_CATEGORIES.filter(c => !c.parentId)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky top bar */}
      <header className="flex h-14 items-center gap-2 border-b border-border px-4 sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <SidebarTrigger className="size-11 -ml-1 text-muted-foreground" />
        <Separator orientation="vertical" className="h-4 mx-1" />
        <Link href="/cms/posts">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground h-9"
          >
            <ArrowLeft className="size-4" />
            Posts
          </Button>
        </Link>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {source && <StatusBadge status={source.status} />}
          <Button variant="outline" size="sm" className="min-h-[44px] gap-2 hidden sm:flex">
            <Eye data-icon="inline-start" />
            Preview
          </Button>
          <Button
            size="sm"
            className="min-h-[44px] gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Saving…
              </span>
            ) : (
              <>
                <Save data-icon="inline-start" />
                Save
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-0">
        {/* Left: Post Details block + editor */}
        <div className="border-r-0 lg:border-r border-border overflow-y-auto">

          {/* ── Post Details Block ── */}
          <div className="border-b border-border bg-muted/20 p-4 md:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Left side: Cover Image (compact) */}
              <div className="w-full sm:w-48 lg:w-56 flex-shrink-0 space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium pl-0.5">Cover Image</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleCoverUpload}
                  aria-label="Upload cover image"
                />
                {coverImage ? (
                  <div className="relative group rounded-lg overflow-hidden border border-border aspect-[4/3]">
                    <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" className="gap-1.5 h-8 w-24" onClick={() => fileRef.current?.click()}>
                        <Upload className="size-3" /> Replace
                      </Button>
                      <Button size="sm" variant="destructive" className="h-8 w-24" onClick={() => setCoverImage('')}>
                        <X className="size-3" /> Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full aspect-[4/3] rounded-lg border border-dashed border-border hover:border-accent/50 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground bg-background shadow-sm"
                  >
                    <ImageIcon className="size-5" />
                    <span className="text-[11px] px-4 text-center leading-tight">Upload cover</span>
                  </button>
                )}
              </div>

              {/* Right side: Fields */}
              <div className="flex-1 space-y-4">
                {/* Title */}
                <div>
                  <Input
                    id="post-title"
                    value={title}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="Post title…"
                    className="text-xl font-bold h-12 focus-visible:ring-1 border-transparent hover:border-border bg-transparent hover:bg-background/50 transition-all px-3 -ml-3 shadow-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Slug */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium pl-0.5" htmlFor="post-slug">URL Slug</label>
                    <div className="flex items-center gap-0 shadow-sm rounded-md">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted rounded-l-md px-2.5 h-9 border border-r-0 border-border whitespace-nowrap">
                        <Link2 className="size-3" />
                        /
                      </div>
                      <Input
                        id="post-slug"
                        value={slug}
                        onChange={e => setSlug(e.target.value)}
                        placeholder="post-slug"
                        className="h-9 rounded-l-none font-mono text-xs focus-visible:ring-1 border-border bg-background"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium pl-0.5">Category</label>
                    <Select value={category} onValueChange={(v) => { if (v) setCategory(v) }}>
                      <SelectTrigger className="h-9 text-xs shadow-sm bg-background">
                        <SelectValue placeholder="Select category…" />
                      </SelectTrigger>
                      <SelectContent>
                        {rootCategories.map(c => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium pl-0.5">
                    Tags
                  </label>
                  <div className="min-h-[36px] rounded-md border border-input bg-background px-2.5 py-1 flex flex-wrap gap-1.5 items-center cursor-text focus-within:ring-1 focus-within:ring-ring shadow-sm"
                    onClick={() => document.getElementById('tag-input')?.focus()}
                  >
                    {tags.map(t => (
                      <Badge key={t} variant="secondary" className="gap-1 pr-1 text-[11px] h-5 font-normal">
                        {t}
                        <button onClick={(e) => { e.stopPropagation(); removeTag(t) }} className="hover:text-destructive transition-colors size-3.5 flex items-center justify-center rounded" aria-label={`Remove tag ${t}`}>
                          <X className="size-2.5" />
                        </button>
                      </Badge>
                    ))}
                    <input
                      id="tag-input"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={addTag}
                      placeholder={tags.length === 0 ? 'Add tags…' : ''}
                      className="flex-1 min-w-[80px] bg-transparent text-xs outline-none placeholder:text-muted-foreground/50 h-6"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Body Editor ── */}
          <div className="p-4 md:p-6">
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Start writing your post…"
              className="min-h-[50vh] resize-none border-0 px-0 focus-visible:ring-0 text-base leading-relaxed bg-transparent text-foreground"
            />
          </div>
        </div>

        {/* ── Sidebar: deep settings ── */}
        <div className="p-4 space-y-4 overflow-y-auto border-t lg:border-t-0">

          {/* Publish / Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Status</label>
                <Select
                  value={status}
                  onValueChange={(v) => { if (v) setStatus(v as PostStatus) }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {status === 'scheduled' && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Schedule Date</label>
                  <Input type="datetime-local" className="h-11 text-sm" />
                </div>
              )}

              <div className="flex items-center justify-between min-h-[44px]">
                <div>
                  <p className="text-xs font-medium">Featured Post</p>
                  <p className="text-[11px] text-muted-foreground">Shown in hero slots</p>
                </div>
                <Switch checked={featured} onCheckedChange={setFeatured} />
              </div>

              {source && (
                <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1 border-t border-border">
                  <p className="flex items-center gap-1"><Clock className="size-3" /> Updated {formatDate(source.updatedAt)}</p>
                  {source.publishedAt && <p className="flex items-center gap-1"><Globe className="size-3" /> Published {formatDate(source.publishedAt)}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Excerpt */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Excerpt</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                placeholder="Short description shown in post lists and previews…"
                className="text-sm resize-none min-h-[80px]"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">{excerpt.length} / 160 chars</p>
            </CardContent>
          </Card>

          {/* SEO / Meta */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                SEO & Meta
                <Badge variant="secondary" className="text-[10px]">Optional</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Meta Title</label>
                <Input
                  value={metaTitle}
                  onChange={e => setMetaTitle(e.target.value)}
                  placeholder="SEO page title…"
                  className="h-10 text-sm"
                />
                <p className="text-[11px] text-muted-foreground">{metaTitle.length} / 60 chars</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Meta Description</label>
                <Textarea
                  value={metaDescription}
                  onChange={e => setMetaDescription(e.target.value)}
                  placeholder="Description for search engines…"
                  className="text-sm resize-none min-h-[70px]"
                />
                <p className="text-[11px] text-muted-foreground">{metaDescription.length} / 160 chars</p>
              </div>
              {/* SERP preview */}
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-0.5">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">SERP Preview</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">{metaTitle || title || 'Page title'}</p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-500">inkwell.example.com › {slug || 'post-slug'}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{metaDescription || excerpt || 'Meta description will appear here…'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Advanced */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-1">
                Advanced
                <ChevronDown className="size-3 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between min-h-[44px]">
                <div>
                  <p className="text-xs font-medium">Allow Comments</p>
                  <p className="text-[11px] text-muted-foreground">Enable reader comments</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between min-h-[44px]">
                <div>
                  <p className="text-xs font-medium">Index in Search</p>
                  <p className="text-[11px] text-muted-foreground">Allow search engine indexing</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
