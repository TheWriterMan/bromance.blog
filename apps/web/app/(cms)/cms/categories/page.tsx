'use client'

import { useState, useEffect } from 'react'
import { FolderOpen, Plus, Pencil, Trash2, ChevronRight, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { PageHeader } from '@/components/cms/page-header'
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '@/lib/cms-api'
import type { Category } from '@/lib/cms-api'

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

interface CategoryFormProps {
  categories: Category[]
  initial?: Partial<Category>
  onSave: (data: { name: string; slug: string; description: string; parentId: string | null }) => void
  onCancel: () => void
}

function CategoryForm({ categories, initial, onSave, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [parentId, setParentId] = useState<string>(initial?.parentId ?? '__none__')
  const [autoSlug, setAutoSlug] = useState(!initial?.id)

  function handleNameChange(val: string) {
    setName(val)
    if (autoSlug) setSlug(slugify(val))
  }

  const rootCategories = categories.filter(c => !c.parentId && c.id !== initial?.id)

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Name *</label>
        <Input value={name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Technology" className="h-11" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Slug</label>
        <Input value={slug} onChange={e => { setSlug(e.target.value); setAutoSlug(false) }} placeholder="auto-generated" className="h-11 font-mono text-sm" />
        <p className="text-[11px] text-muted-foreground">URL: /category/{slug || 'slug'}</p>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Parent Category</label>
        <Select value={parentId} onValueChange={(v) => setParentId(v ?? '__none__')}>
          <SelectTrigger className="h-11"><SelectValue placeholder="None (top-level)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None (top-level)</SelectItem>
            {rootCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Description</label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description…" className="resize-none min-h-[80px] text-sm" />
      </div>
      <Separator />
      <div className="flex gap-2">
        <Button className="flex-1 min-h-[44px] gap-2" onClick={() => onSave({ name, slug, description, parentId: parentId === '__none__' ? null : parentId })} disabled={!name.trim()}>
          <Save className="size-4" />
          {initial?.id ? 'Update' : 'Create'} Category
        </Button>
        <Button variant="outline" className="min-h-[44px]" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const roots = categories.filter(c => !c.parentId)
  const childrenOf = (parentId: string) => categories.filter(c => c.parentId === parentId)

  async function handleCreate(data: { name: string; slug: string; description: string; parentId: string | null }) {
    const created = await createCategory({ name: data.name, slug: data.slug, description: data.description, parent_id: data.parentId })
    setCategories(prev => [...prev, created])
    setShowNew(false)
  }

  async function handleUpdate(data: { name: string; slug: string; description: string; parentId: string | null }) {
    if (!editTarget) return
    const updated = await updateCategory(editTarget.id, { name: data.name, slug: data.slug, description: data.description, parent_id: data.parentId })
    setCategories(prev => prev.map(c => c.id === editTarget.id ? updated : c))
    setEditTarget(null)
  }

  async function handleDelete(cat: Category) {
    const hasChildren = categories.some(c => c.parentId === cat.id)
    if (hasChildren) {
      setDeleteTarget(null)
      return
    }
    await deleteCategory(cat.id, true)
    setCategories(prev => prev.filter(c => c.id !== cat.id))
    setDeleteTarget(null)
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <PageHeader title="Categories" />
        <main className="flex-1 p-4 md:p-6">
          <div className="animate-pulse space-y-2 max-w-2xl">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl" />)}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Categories"
        description={`${categories.length} categories`}
        actions={
          <Button size="sm" className="min-h-[44px] gap-2" onClick={() => setShowNew(true)}>
            <Plus className="size-4" />
            New Category
          </Button>
        }
      />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-2xl space-y-2">
          {roots.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <FolderOpen className="size-10 text-muted-foreground/40" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">No categories yet</p>
              <Button size="sm" onClick={() => setShowNew(true)} className="gap-2">
                <Plus className="size-4" />
                Create first category
              </Button>
            </div>
          )}

          {roots.map(cat => {
            const children = childrenOf(cat.id)
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 group hover:bg-muted/20 transition-colors min-h-[64px]">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                    <FolderOpen className="size-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{cat.name}</span>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                        {cat.postCount} post{cat.postCount !== 1 ? 's' : ''}
                      </Badge>
                      {children.length > 0 && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-muted-foreground">
                          {children.length} sub
                        </Badge>
                      )}
                    </div>
                    {cat.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{cat.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0">
                    <Button variant="ghost" size="icon" className="size-9" onClick={() => setEditTarget(cat)} aria-label={`Edit ${cat.name}`}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-9 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(cat)} aria-label={`Delete ${cat.name}`}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {children.map(child => (
                  <div key={child.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 group hover:bg-muted/40 transition-colors mt-1 ml-8 min-h-[56px]">
                    <ChevronRight className="size-3.5 text-muted-foreground/40 flex-shrink-0" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{child.name}</span>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                          {child.postCount} post{child.postCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      {child.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{child.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0">
                      <Button variant="ghost" size="icon" className="size-9" onClick={() => setEditTarget(child)} aria-label={`Edit ${child.name}`}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-9 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(child)} aria-label={`Delete ${child.name}`}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </main>

      {/* New / Edit Sheet */}
      <Sheet open={showNew || !!editTarget} onOpenChange={open => { if (!open) { setShowNew(false); setEditTarget(null) } }}>
        <SheetContent className="w-[340px] sm:w-[400px] p-0">
          <SheetHeader className="px-4 pt-4 pb-0">
            <SheetTitle>{editTarget ? 'Edit Category' : 'New Category'}</SheetTitle>
            <SheetDescription className="text-xs">
              {editTarget ? 'Update the category details below.' : 'Fill in the details to create a new category.'}
            </SheetDescription>
          </SheetHeader>
          <CategoryForm
            categories={categories}
            initial={editTarget ?? undefined}
            onSave={editTarget ? handleUpdate : handleCreate}
            onCancel={() => { setShowNew(false); setEditTarget(null) }}
          />
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong> will be permanently deleted.
              {deleteTarget && deleteTarget.postCount > 0 && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400">
                  Warning: {deleteTarget.postCount} post{deleteTarget.postCount !== 1 ? 's' : ''} use this category.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && handleDelete(deleteTarget)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
