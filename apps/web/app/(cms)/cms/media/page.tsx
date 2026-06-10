'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, Search, Trash2, Copy, CheckCheck, ImageIcon, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/cms/page-header'
import { fetchMedia, uploadMedia, deleteMedia, bulkDeleteMedia, formatFileSize, getCloudinaryUrl } from '@/lib/cms-api'
import type { MediaItem } from '@/lib/cms-api'
import { cn } from '@/lib/utils'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [dragging, setDragging] = useState(false)
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchMedia()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter(item =>
    item.filename.toLowerCase().includes(search.toLowerCase())
  )

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds)
    await bulkDeleteMedia(ids)
    setItems(prev => prev.filter(i => !selectedIds.has(i.id)))
    setSelectedIds(new Set())
    setShowBulkDelete(false)
  }

  async function handleDelete(id: string) {
    await deleteMedia(id)
    setItems(prev => prev.filter(i => i.id !== id))
    setDeleteTarget(null)
    if (selected?.id === id) setSelected(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }

  async function handleFiles(files: File[]) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (!imageFiles.length) return

    for (const file of imageFiles) {
      try {
        const item = await uploadMedia(file)
        setItems(prev => [item, ...prev])
      } catch (e) {
        console.error('Upload failed:', e)
      }
    }
  }

  function handleCopyUrl(item: MediaItem) {
    const fullUrl = getCloudinaryUrl(item.cloudinaryId, { width: 1200, quality: 'auto' })
    navigator.clipboard.writeText(fullUrl).catch(() => {})
    setCopiedId(item.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <PageHeader title="Media Library" />
        <main className="flex-1 p-4 md:p-6">
          <div className="animate-pulse grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-muted rounded-lg" />)}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Media Library"
        description={`${items.length} files`}
        actions={
          <Button size="sm" className="min-h-[44px] gap-2" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Upload
          </Button>
        }
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={e => e.target.files && handleFiles(Array.from(e.target.files))}
        aria-label="Upload files"
      />

      <main className="flex-1 p-4 md:p-6 space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all py-8 px-4',
            dragging ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50 hover:bg-muted/30'
          )}
          role="button"
          tabIndex={0}
          aria-label="Upload media files"
          onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
        >
          <div className={cn('flex size-12 items-center justify-center rounded-full', dragging ? 'bg-accent/20' : 'bg-muted')}>
            <Upload className={cn('size-6', dragging ? 'text-accent-foreground' : 'text-muted-foreground')} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {dragging ? 'Drop files here' : 'Drag & drop files, or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Supports JPG, PNG, WebP, GIF</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search files…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-11" aria-label="Search media" />
          </div>
          {selectedIds.size > 0 && (
            <Button variant="destructive" className="h-11 gap-2" onClick={() => setShowBulkDelete(true)}>
              <Trash2 className="size-4" /> Delete {selectedIds.size} files
            </Button>
          )}
          <Tabs value={viewMode} onValueChange={v => setViewMode(v as 'grid' | 'list')}>
            <TabsList className="h-11">
              <TabsTrigger value="grid" className="size-10 p-0" aria-label="Grid view"><LayoutGrid className="size-4" /></TabsTrigger>
              <TabsTrigger value="list" className="size-10 p-0" aria-label="List view"><List className="size-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <ImageIcon className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No media files found</p>
          </div>
        )}

        {/* Grid view */}
        {viewMode === 'grid' && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map(item => (
              <div
                key={item.id}
                className={cn(
                  'group relative rounded-lg overflow-hidden border cursor-pointer transition-all hover:shadow-md',
                  selected?.id === item.id || selectedIds.has(item.id) ? 'ring-2 ring-accent border-accent' : 'border-border hover:border-accent/50'
                )}
                onClick={() => setSelected(selected?.id === item.id ? null : item)}
              >
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={() => toggleSelect(item.id)}
                    onClick={e => e.stopPropagation()}
                    className={cn('bg-background/80 backdrop-blur-sm shadow-sm transition-opacity', selectedIds.has(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}
                  />
                </div>
                <div className="aspect-square bg-muted">
                  <img src={item.url} alt={item.filename} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-foreground truncate">{item.filename}</p>
                  <p className="text-[10px] text-muted-foreground">{formatFileSize(item.bytes)}</p>
                </div>
                {item.usedIn > 0 && (
                  <Badge className="absolute top-1.5 right-1.5 text-[10px] h-4 px-1 bg-foreground/70 text-background">
                    {item.usedIn}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* List view */}
        {viewMode === 'list' && filtered.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden bg-card divide-y divide-border">
            {filtered.map(item => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors group',
                  selected?.id === item.id && 'bg-accent/10'
                )}
                onClick={() => setSelected(selected?.id === item.id ? null : item)}
              >
                <img src={item.url} alt={item.filename} className="size-10 rounded-md object-cover flex-shrink-0" loading="lazy" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.filename}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(item.bytes)} · {item.width}×{item.height}</p>
                </div>
                <span className="text-xs text-muted-foreground hidden md:block">{formatDate(item.createdAt)}</span>
                {item.usedIn > 0 && <Badge variant="secondary" className="text-xs hidden sm:flex">{item.usedIn} use{item.usedIn !== 1 ? 's' : ''}</Badge>}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="size-9" onClick={e => { e.stopPropagation(); handleCopyUrl(item) }} aria-label="Copy URL">
                    {copiedId === item.id ? <CheckCheck className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="size-9 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); setDeleteTarget(item.id) }} aria-label="Delete">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Detail sheet */}
      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent className="w-[320px] sm:w-[380px] p-0 flex flex-col">
          <SheetHeader className="px-4 py-4 border-b border-border">
            <SheetTitle className="text-sm truncate pr-6">{selected?.filename}</SheetTitle>
            <SheetDescription className="sr-only">File details</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <img src={selected.url} alt={selected.filename} className="w-full rounded-lg object-cover max-h-48" />
              <Separator />
              <div className="space-y-3 text-sm">
                {[
                  { label: 'File name', value: selected.filename },
                  { label: 'Size', value: formatFileSize(selected.bytes) },
                  { label: 'Format', value: selected.format.toUpperCase() },
                  { label: 'Dimensions', value: `${selected.width} × ${selected.height}` },
                  { label: 'Uploaded', value: formatDate(selected.createdAt) },
                  { label: 'Used in', value: `${selected.usedIn} post${selected.usedIn !== 1 ? 's' : ''}` },
                ].map(row => (
                  <div key={row.label} className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground text-xs">{row.label}</span>
                    <span className="text-xs font-medium text-right max-w-[160px] truncate">{row.value}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <Button variant="outline" className="w-full min-h-[44px] gap-2" onClick={() => handleCopyUrl(selected)}>
                {copiedId === selected.id ? <CheckCheck className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                Copy URL
              </Button>
              <Button variant="destructive" className="w-full min-h-[44px] gap-2" onClick={() => setDeleteTarget(selected.id)}>
                <Trash2 className="size-4" /> Delete file
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>This file will be permanently deleted from Cloudinary.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && handleDelete(deleteTarget)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} files?</AlertDialogTitle>
            <AlertDialogDescription>These files will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
