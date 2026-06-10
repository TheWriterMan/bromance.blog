'use client'

import { useState, useRef } from 'react'
import {
  Upload,
  Search,
  Trash2,
  Copy,
  CheckCheck,
  ImageIcon,
  LayoutGrid,
  List,
  X,
  Crop,
  RotateCcw,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { PageHeader } from '@/components/cms/page-header'
import { MOCK_MEDIA, formatFileSize, formatDate, type MediaItem } from '@/lib/mock-data'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Cloudinary-style crop config ────────────────────────────────────────────

type AspectRatio = '16:9' | '4:3' | '1:1' | '3:2' | '2:3' | '9:16' | 'free'
type CropMode = 'fill' | 'fit' | 'crop' | 'thumb' | 'scale'
type Gravity = 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west'

interface CropConfig {
  aspectRatio: AspectRatio
  mode: CropMode
  gravity: Gravity
  width: number
  quality: number
  format: 'auto' | 'webp' | 'jpg' | 'png'
}

const DEFAULT_CROP: CropConfig = {
  aspectRatio: '16:9',
  mode: 'fill',
  gravity: 'auto',
  width: 1200,
  quality: 80,
  format: 'auto',
}

const ASPECT_RATIOS: { label: string; value: AspectRatio; ratio?: number }[] = [
  { label: '16:9', value: '16:9', ratio: 16 / 9 },
  { label: '4:3', value: '4:3', ratio: 4 / 3 },
  { label: '1:1', value: '1:1', ratio: 1 },
  { label: '3:2', value: '3:2', ratio: 3 / 2 },
  { label: '2:3', value: '2:3', ratio: 2 / 3 },
  { label: '9:16', value: '9:16', ratio: 9 / 16 },
  { label: 'Free', value: 'free' },
]

/** Build a Cloudinary-style transform URL string (for display) */
function buildTransformUrl(baseUrl: string, config: CropConfig): string {
  const parts: string[] = []
  parts.push(`w_${config.width}`)
  if (config.aspectRatio !== 'free') {
    const ar = config.aspectRatio.replace(':', '_')
    parts.push(`ar_${ar}`)
  }
  parts.push(`c_${config.mode}`)
  if (config.gravity !== 'auto') parts.push(`g_${config.gravity}`)
  parts.push(`q_${config.quality}`)
  if (config.format !== 'auto') parts.push(`f_${config.format}`)

  // For Unsplash URLs we simulate by appending as query params (real Cloudinary uses path transforms)
  const separator = baseUrl.includes('?') ? '&' : '?'
  const ratio = ASPECT_RATIOS.find(r => r.value === config.aspectRatio)?.ratio
  const height = ratio ? Math.round(config.width / ratio) : undefined
  const heightParam = height ? `&h=${height}` : ''
  return `${baseUrl.split('?')[0]}?w=${config.width}${heightParam}&fit=crop&q=${config.quality}`
}

// ─── Crop Panel ───────────────────────────────────────────────────────────────

function CropPanel({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  const [config, setConfig] = useState<CropConfig>(DEFAULT_CROP)
  const [copied, setCopied] = useState(false)

  const previewUrl = buildTransformUrl(item.url, config)
  const transformString = [
    `w_${config.width}`,
    config.aspectRatio !== 'free' ? `ar_${config.aspectRatio.replace(':', '_')}` : '',
    `c_${config.mode}`,
    config.gravity !== 'auto' ? `g_${config.gravity}` : '',
    `q_${config.quality}`,
    config.format !== 'auto' ? `f_${config.format}` : '',
  ].filter(Boolean).join(',')

  function handleCopy() {
    navigator.clipboard.writeText(previewUrl).catch(() => {})
    setCopied(true)
    toast.success('Transformed URL copied')
    setTimeout(() => setCopied(false), 2000)
  }

  function handleReset() {
    setConfig(DEFAULT_CROP)
    toast.info('Crop settings reset')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Crop className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Crop & Transform</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-8" onClick={handleReset} aria-label="Reset to defaults">
            <RotateCcw className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={onClose} aria-label="Close crop panel">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Preview */}
        <div className="bg-muted/40 p-4 flex items-center justify-center min-h-[200px]">
          <div className="relative max-w-full overflow-hidden rounded-lg shadow-md"
            style={{
              width: '100%',
              aspectRatio: config.aspectRatio !== 'free'
                ? config.aspectRatio.replace(':', '/')
                : '16/9',
            }}
          >
            <img
              src={previewUrl}
              alt={item.alt}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 ring-2 ring-accent ring-inset rounded-lg pointer-events-none" />
          </div>
        </div>

        <div className="p-4 space-y-5">
          {/* Aspect Ratio */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Aspect Ratio</label>
            <div className="flex flex-wrap gap-1.5">
              {ASPECT_RATIOS.map(ar => (
                <button
                  key={ar.value}
                  onClick={() => setConfig(c => ({ ...c, aspectRatio: ar.value }))}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors min-h-[32px]',
                    config.aspectRatio === ar.value
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background border-border text-muted-foreground hover:border-foreground/40'
                  )}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>

          {/* Crop Mode */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Crop Mode</label>
            <Select value={config.mode} onValueChange={(v) => { if (v) setConfig(c => ({ ...c, mode: v as CropMode })) }}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fill">Fill — crop to exact dimensions</SelectItem>
                <SelectItem value="fit">Fit — contain within dimensions</SelectItem>
                <SelectItem value="crop">Crop — no upscaling</SelectItem>
                <SelectItem value="thumb">Thumbnail — smart face/object crop</SelectItem>
                <SelectItem value="scale">Scale — stretch to fill</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gravity */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Focus / Gravity</label>
            <div className="grid grid-cols-3 gap-1">
              {(['auto', 'face', 'center', 'north', 'south', 'east', 'west'] as Gravity[]).map(g => (
                <button
                  key={g}
                  onClick={() => setConfig(c => ({ ...c, gravity: g }))}
                  className={cn(
                    'px-2 py-1.5 rounded-md text-xs font-medium border transition-colors min-h-[36px] capitalize',
                    config.gravity === g
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background border-border text-muted-foreground hover:border-foreground/40'
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Width */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Width (px)</label>
              <span className="text-xs font-mono text-muted-foreground">{config.width}px</span>
            </div>
            <Slider
              value={[config.width]}
              onValueChange={(val: any) => {
                const w = Array.isArray(val) ? val[0] : (val?.target?.value ?? val)
                if (typeof w === 'number') setConfig(c => ({ ...c, width: w }))
              }}
              min={100}
              max={3840}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>100px</span>
              <span>3840px</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[400, 800, 1200, 1920].map(w => (
                <button
                  key={w}
                  onClick={() => setConfig(c => ({ ...c, width: w }))}
                  className={cn(
                    'px-2 py-0.5 rounded text-[11px] border transition-colors',
                    config.width === w
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border text-muted-foreground hover:border-foreground/40'
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Quality</label>
              <span className="text-xs font-mono text-muted-foreground">{config.quality}%</span>
            </div>
            <Slider
              value={[config.quality]}
              onValueChange={(val: any) => {
                const q = Array.isArray(val) ? val[0] : (val?.target?.value ?? val)
                if (typeof q === 'number') setConfig(c => ({ ...c, quality: q }))
              }}
              min={10}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Format */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Output Format</label>
            <div className="flex gap-1.5">
              {(['auto', 'webp', 'jpg', 'png'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setConfig(c => ({ ...c, format: f }))}
                  className={cn(
                    'flex-1 py-1.5 rounded-md text-xs font-medium border transition-colors min-h-[36px] uppercase',
                    config.format === f
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background border-border text-muted-foreground hover:border-foreground/40'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Apply button & Backend Note */}
          <div className="space-y-3">
            <div className="rounded-md bg-muted/60 border border-border p-3 text-[11px] text-muted-foreground leading-relaxed">
              <strong>Backend Implementation Note:</strong>
              <p className="mt-1">
                In a real production environment using Cloudinary or similar providers:
                <br/>1. We don't modify the source file directly.
                <br/>2. Instead, we generate a transformed URL (e.g., <code>.../image/upload/w_1200,c_fill,g_auto/...</code>).
                <br/>3. The backend caches and delivers the dynamically cropped image at edge nodes.
              </p>
            </div>
            
            <Button
              className="w-full gap-2"
              onClick={() => {
                // Here we simulate the URL update logic.
                item.url = previewUrl
                toast.success('Crop settings applied')
                onClose()
              }}
            >
              <CheckCheck className="size-4" />
              Apply Transformation
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>(MOCK_MEDIA)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [dragging, setDragging] = useState(false)
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [cropItem, setCropItem] = useState<MediaItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = items.filter(item =>
    item.filename.toLowerCase().includes(search.toLowerCase()) ||
    item.alt.toLowerCase().includes(search.toLowerCase())
  )

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleBulkDelete() {
    setItems(prev => prev.filter(i => !selectedIds.has(i.id)))
    const count = selectedIds.size
    setSelectedIds(new Set())
    setShowBulkDelete(false)
    toast.success(`${count} file${count > 1 ? 's' : ''} deleted`)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFiles(Array.from(e.dataTransfer.files))
  }

  function handleFiles(files: File[]) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (!imageFiles.length) { toast.error('Only image files are supported'); return }
    imageFiles.forEach(file => {
      const newItem: MediaItem = {
        id: `m-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        filename: file.name,
        url: URL.createObjectURL(file),
        type: 'image',
        mimeType: file.type,
        size: file.size,
        alt: file.name.replace(/\.[^.]+$/, '').replace(/-/g, ' '),
        uploadedAt: new Date().toISOString(),
        usedIn: 0,
      }
      setItems(prev => [newItem, ...prev])
    })
    toast.success(`${imageFiles.length} file${imageFiles.length > 1 ? 's' : ''} uploaded`)
  }

  function handleCopyUrl(item: MediaItem) {
    navigator.clipboard.writeText(item.url).catch(() => {})
    setCopiedId(item.id)
    toast.success('URL copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    setDeleteTarget(null)
    if (selected?.id === id) setSelected(null)
    toast.success('File deleted')
  }

  const deleteItem = items.find(i => i.id === deleteTarget)

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Media Library"
        description={`${items.length} files`}
        actions={
          <Button size="sm" className="min-h-[44px] gap-2" onClick={() => fileRef.current?.click()}>
            <Upload data-icon="inline-start" />
            Upload
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
            dragging
              ? 'border-accent bg-accent/10 scale-[1.01]'
              : 'border-border hover:border-accent/50 hover:bg-muted/30'
          )}
          role="button"
          tabIndex={0}
          aria-label="Upload media files by clicking or dropping"
          onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
        >
          <div className={cn('flex size-12 items-center justify-center rounded-full transition-colors', dragging ? 'bg-accent/20' : 'bg-muted')}>
            <Upload className={cn('size-6 transition-colors', dragging ? 'text-accent-foreground' : 'text-muted-foreground')} aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {dragging ? 'Drop files here' : 'Drag & drop files, or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Supports JPG, PNG, WebP, GIF, SVG</p>
          </div>
        </div>

        {/* Filters & Bulk Actions */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search files…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-11"
              aria-label="Search media files"
            />
          </div>
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              className="h-11 gap-2"
              onClick={() => setShowBulkDelete(true)}
            >
              <Trash2 className="size-4" />
              Delete {selectedIds.size} files
            </Button>
          )}
          <Tabs value={viewMode} onValueChange={v => setViewMode(v as 'grid' | 'list')}>
            <TabsList className="h-11">
              <TabsTrigger value="grid" className="size-10 p-0" aria-label="Grid view">
                <LayoutGrid className="size-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="size-10 p-0" aria-label="List view">
                <List className="size-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <ImageIcon className="size-10 text-muted-foreground/40" aria-hidden="true" />
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
                role="button"
                tabIndex={0}
                aria-label={`Select ${item.filename}`}
                onKeyDown={e => e.key === 'Enter' && setSelected(selected?.id === item.id ? null : item)}
              >
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={() => toggleSelect(item.id)}
                    onClick={(e) => e.stopPropagation()}
                    className={cn("bg-background/80 backdrop-blur-sm shadow-sm transition-opacity", selectedIds.has(item.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
                  />
                </div>
                <div className="aspect-square bg-muted">
                  <img src={item.url} alt={item.alt} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-foreground truncate">{item.filename}</p>
                  <p className="text-[10px] text-muted-foreground">{formatFileSize(item.size)}</p>
                </div>
                {/* Hover actions */}
                <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="size-9"
                    onClick={e => { e.stopPropagation(); setCropItem(item) }}
                    aria-label="Crop image"
                  >
                    <Crop className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="size-9"
                    onClick={e => { e.stopPropagation(); handleCopyUrl(item) }}
                    aria-label="Copy URL"
                  >
                    {copiedId === item.id ? <CheckCheck className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="size-9"
                    onClick={e => { e.stopPropagation(); setDeleteTarget(item.id) }}
                    aria-label="Delete file"
                  >
                    <Trash2 className="size-4" />
                  </Button>
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
                role="button"
                tabIndex={0}
                aria-label={`Select ${item.filename}`}
                onKeyDown={e => e.key === 'Enter' && setSelected(selected?.id === item.id ? null : item)}
              >
                <img src={item.url} alt={item.alt} className="size-10 rounded-md object-cover flex-shrink-0" loading="lazy" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.filename}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(item.size)} · {item.width && item.height ? `${item.width}×${item.height}` : item.mimeType}</p>
                </div>
                <span className="text-xs text-muted-foreground hidden md:block">{formatDate(item.uploadedAt)}</span>
                {item.usedIn > 0 && (
                  <Badge variant="secondary" className="text-xs hidden sm:flex">{item.usedIn} use{item.usedIn !== 1 ? 's' : ''}</Badge>
                )}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="size-9"
                    onClick={e => { e.stopPropagation(); setCropItem(item) }} aria-label="Crop image">
                    <Crop className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="size-9"
                    onClick={e => { e.stopPropagation(); handleCopyUrl(item) }} aria-label="Copy URL">
                    {copiedId === item.id ? <CheckCheck className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="size-9 text-destructive hover:text-destructive"
                    onClick={e => { e.stopPropagation(); setDeleteTarget(item.id) }} aria-label="Delete file">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Detail sheet */}
      <Sheet open={!!selected && !cropItem} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-[320px] sm:w-[380px] p-0 flex flex-col">
          <SheetHeader className="px-4 py-4 border-b border-border">
            <SheetTitle className="text-sm truncate pr-6">{selected?.filename}</SheetTitle>
            <SheetDescription className="sr-only">File details</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                <img src={selected.url} alt={selected.alt} className="w-full rounded-lg object-cover max-h-48" />
                <Separator />
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'File name', value: selected.filename },
                    { label: 'Size', value: formatFileSize(selected.size) },
                    { label: 'Type', value: selected.mimeType },
                    { label: 'Dimensions', value: selected.width && selected.height ? `${selected.width} × ${selected.height}` : '—' },
                    { label: 'Uploaded', value: formatDate(selected.uploadedAt) },
                    { label: 'Used in', value: `${selected.usedIn} post${selected.usedIn !== 1 ? 's' : ''}` },
                  ].map(row => (
                    <div key={row.label} className="flex items-start justify-between gap-2">
                      <span className="text-muted-foreground text-xs">{row.label}</span>
                      <span className="text-xs font-medium text-right max-w-[160px] truncate">{row.value}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">URL</label>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={selected.url} className="text-xs h-9 font-mono" />
                    <Button size="icon" variant="outline" className="size-9 flex-shrink-0"
                      onClick={() => handleCopyUrl(selected)} aria-label="Copy URL">
                      {copiedId === selected.id ? <CheckCheck className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                    </Button>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full min-h-[44px] gap-2"
                  onClick={() => { setCropItem(selected); setSelected(null) }}
                >
                  <Crop className="size-4" data-icon="inline-start" />
                  Crop & Transform
                </Button>
                <Button
                  variant="destructive"
                  className="w-full min-h-[44px] gap-2"
                  onClick={() => setDeleteTarget(selected.id)}
                >
                  <Trash2 className="size-4" data-icon="inline-start" />
                  Delete file
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Crop sheet */}
      <Sheet open={!!cropItem} onOpenChange={(o) => !o && setCropItem(null)}>
        <SheetContent className="w-full sm:w-[480px] p-0 flex flex-col" side="right">
          <SheetTitle className="sr-only">Crop and Transform Image</SheetTitle>
          <SheetDescription className="sr-only">Adjust crop settings using Cloudinary URL parameters</SheetDescription>
          {cropItem && (
            <CropPanel item={cropItem} onClose={() => setCropItem(null)} />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteItem?.filename}</strong> will be permanently deleted.
              {deleteItem && deleteItem.usedIn > 0 && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400">
                  Warning: This file is used in {deleteItem.usedIn} post{deleteItem.usedIn !== 1 ? 's' : ''}. Deleting it will break those references.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} files?</AlertDialogTitle>
            <AlertDialogDescription>
              These files will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedIds.size} files
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
