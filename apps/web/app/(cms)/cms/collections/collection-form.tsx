'use client'

import { useState } from 'react'
import { Save, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import MediaPickerModal from '@/components/cms/media/media-picker-modal'
import { getCloudinaryUrl } from '@/lib/cms-api'
import type { CollectionItem } from '@/lib/cms-api'

export interface CollectionFormData {
  name: string
  slug: string
  description: string
  coverImage: string
  status: 'ongoing' | 'completed'
  altTitle: string
  originalTitle: string
  genres: string
  tags: string
  translator: string
  author: string
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

interface Props {
  initial?: CollectionItem
  onSave: (data: CollectionFormData) => void
  onCancel: () => void
}

export function CollectionForm({ initial, onSave, onCancel }: Props) {
  const meta = (initial?.metadata ?? {}) as Record<string, unknown>

  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? '')
  const [status, setStatus] = useState<'ongoing' | 'completed'>(initial?.status ?? 'ongoing')
  const [altTitle, setAltTitle] = useState(String(meta.altTitle ?? ''))
  const [originalTitle, setOriginalTitle] = useState(String(meta.originalTitle ?? ''))
  const [genres, setGenres] = useState(Array.isArray(meta.genres) ? (meta.genres as string[]).join(', ') : '')
  const [tags, setTags] = useState(Array.isArray(meta.tags) ? (meta.tags as string[]).join(', ') : '')
  const [translator, setTranslator] = useState(String(meta.translator ?? ''))
  const [author, setAuthor] = useState(String(meta.author ?? ''))
  const [autoSlug, setAutoSlug] = useState(!initial?.id)
  const [showPicker, setShowPicker] = useState(false)

  function handleNameChange(val: string) {
    setName(val)
    if (autoSlug) setSlug(slugify(val))
  }

  return (
    <div className="space-y-4 p-4 overflow-y-auto max-h-[calc(100vh-120px)]">
      {/* Cover image */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Cover Image</label>
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="w-full h-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30 hover:bg-muted/50 transition-colors"
          aria-label="Pick cover image"
        >
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getCloudinaryUrl(coverImage, { width: 320, height: 128, crop: 'fill' })} alt="Cover" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImageIcon className="size-6" />
              <span className="text-xs">Pick from media</span>
            </div>
          )}
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Name *</label>
        <Input value={name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. The Untamed" className="h-11" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Slug</label>
        <Input value={slug} onChange={e => { setSlug(e.target.value); setAutoSlug(false) }} placeholder="auto-generated" className="h-11 font-mono text-sm" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Status</label>
        <Select value={status} onValueChange={v => setStatus(v as 'ongoing' | 'completed')}>
          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Synopsis</label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief synopsis…" className="resize-none min-h-[80px] text-sm" />
      </div>

      <Separator />
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Metadata</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Alt Title</label>
          <Input value={altTitle} onChange={e => setAltTitle(e.target.value)} className="h-10 text-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Original Title</label>
          <Input value={originalTitle} onChange={e => setOriginalTitle(e.target.value)} className="h-10 text-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Author</label>
          <Input value={author} onChange={e => setAuthor(e.target.value)} className="h-10 text-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Translator</label>
          <Input value={translator} onChange={e => setTranslator(e.target.value)} className="h-10 text-sm" />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Genres <span className="font-normal text-muted-foreground/60">(comma-separated)</span></label>
        <Input value={genres} onChange={e => setGenres(e.target.value)} placeholder="Romance, Drama, Historical" className="h-10 text-sm" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Tags <span className="font-normal text-muted-foreground/60">(comma-separated)</span></label>
        <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="completed, recommended" className="h-10 text-sm" />
      </div>

      {initial?.rating != null && initial.rating > 0 && (
        <p className="text-xs text-muted-foreground">Computed rating: ⭐ {initial.rating.toFixed(1)} ({initial.reviewsCount} reviews)</p>
      )}

      <Separator />
      <div className="flex gap-2">
        <Button className="flex-1 min-h-[44px] gap-2" onClick={() => onSave({ name, slug, description, coverImage, status, altTitle, originalTitle, genres, tags, translator, author })} disabled={!name.trim()}>
          <Save className="size-4" />
          {initial?.id ? 'Update' : 'Create'} Work
        </Button>
        <Button variant="outline" className="min-h-[44px]" onClick={onCancel}>Cancel</Button>
      </div>

      <MediaPickerModal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={item => { setCoverImage(item.cloudinary_id); setShowPicker(false) }}
      />
    </div>
  )
}
