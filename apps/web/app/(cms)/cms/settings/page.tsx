'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Save, Globe, ChevronRight, UserCircle, HardDrive, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/cms/page-header'
import { toast } from 'sonner'
import { fetchSettings, updateSettings, createContentType } from '@/lib/cms-api'

const TIMEZONES = [
  'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York',
  'Europe/London', 'Europe/Paris', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney',
]

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 py-4">
      <div className="sm:w-48 flex-shrink-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [newTypePrefix, setNewTypePrefix] = useState('')
  const [newTypeIcon, setNewTypeIcon] = useState('')
  const [creatingType, setCreatingType] = useState(false)

  useEffect(() => {
    fetchSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function set(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateSettings(settings)
      toast.success('Settings saved')
    } catch (e) {
      console.error(e)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateContentType() {
    if (!newTypeName.trim()) return
    setCreatingType(true)
    try {
      await createContentType({
        name: newTypeName.trim(),
        url_prefix: newTypePrefix.trim() || undefined,
        icon: newTypeIcon.trim() || undefined,
      })
      toast.success(`Content type "${newTypeName}" created`)
      setNewTypeName('')
      setNewTypePrefix('')
      setNewTypeIcon('')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create content type'
      toast.error(msg)
    } finally {
      setCreatingType(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <PageHeader title="Site Settings" />
        <main className="flex-1 p-4 md:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-48 bg-muted rounded-lg" />
          </div>
        </main>
      </div>
    )
  }

  const maintenanceMode = settings.maintenance_mode === 'true'

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Site Settings"
        description="Manage your blog configuration"
        actions={
          <Button size="sm" className="min-h-[44px] gap-2" onClick={handleSave} disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Saving…
              </span>
            ) : (
              <><Save className="size-4" /> Save Changes</>
            )}
          </Button>
        }
      />

      <main className="flex-1 p-4 md:p-6">
        <div className="space-y-6">
          {/* Quick nav */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { href: '/cms/settings/author', icon: UserCircle, label: 'Author Profile', desc: 'Name, bio, avatar' },
              { href: '/cms/settings/backups', icon: HardDrive, label: 'Backups', desc: 'Manage site backups' },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <Card className="hover:bg-muted/30 transition-colors cursor-pointer min-h-[64px]">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                      <item.icon className="size-4 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Site Identity</CardTitle>
              <CardDescription className="text-xs">How your blog appears to visitors and search engines.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0 px-4">
              <SettingRow label="Site Name" description="The title of your blog.">
                <Input value={settings.site_name || ''} onChange={e => set('site_name', e.target.value)} className="h-11" />
              </SettingRow>
              <SettingRow label="Tagline" description="A short phrase about your blog.">
                <Input value={settings.site_tagline || ''} onChange={e => set('site_tagline', e.target.value)} className="h-11" />
              </SettingRow>
              <SettingRow label="Description" description="Used for SEO meta description.">
                <Textarea value={settings.site_description || ''} onChange={e => set('site_description', e.target.value)} className="resize-none text-sm min-h-[80px]" />
              </SettingRow>
              <SettingRow label="Copyright Text" description="Shown in the site footer.">
                <Input value={settings.copyright || ''} onChange={e => set('copyright', e.target.value)} className="h-11" />
              </SettingRow>
            </CardContent>
          </Card>

          {/* URL & Locale */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">URL &amp; Locale</CardTitle>
              <CardDescription className="text-xs">Configure your site address and regional settings.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0 px-4">
              <SettingRow label="Site URL" description="The public address of your blog.">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
                  <Input value={settings.site_url || ''} onChange={e => set('site_url', e.target.value)} className="h-11 pl-9" />
                </div>
              </SettingRow>
              <SettingRow label="Timezone" description="Used for scheduling and timestamps.">
                <Select value={settings.timezone || 'Asia/Kolkata'} onValueChange={v => set('timezone', v ?? 'Asia/Kolkata')}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-48">
                    {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="Posts Per Page" description="Number of posts shown per archive page.">
                <Input type="number" min={1} max={50} value={settings.posts_per_page || '10'} onChange={e => set('posts_per_page', e.target.value)} className="h-11 w-32" />
              </SettingRow>
            </CardContent>
          </Card>

          {/* Support & Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Support &amp; Contact</CardTitle>
              <CardDescription className="text-xs">Links shown across the public blog footer, header, and post pages.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0 px-4">
              <SettingRow label="Ko-fi Link" description="Support button shown in the header, footer, and articles.">
                <Input value={settings.kofi_link || ''} onChange={e => set('kofi_link', e.target.value)} placeholder="https://ko-fi.com/yourname" className="h-11" />
              </SettingRow>
              <SettingRow label="Contact Email" description="Shown in the public footer contact section.">
                <Input type="email" value={settings.contact_email || ''} onChange={e => set('contact_email', e.target.value)} placeholder="hello@bromance.blog" className="h-11" />
              </SettingRow>
            </CardContent>
          </Card>

          {/* Content Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">New Content Type</CardTitle>
              <CardDescription className="text-xs">Add a new type (e.g. Recipes, Comics). It will appear in the sidebar automatically.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0 px-4">
              <SettingRow label="Name *" description="Display name for this content type.">
                <Input value={newTypeName} onChange={e => setNewTypeName(e.target.value)} placeholder="e.g. Recipes" className="h-11" />
              </SettingRow>
              <SettingRow label="URL Prefix" description="Optional. Defaults to kebab-case of name.">
                <Input value={newTypePrefix} onChange={e => setNewTypePrefix(e.target.value)} placeholder="e.g. recipes" className="h-11 font-mono text-sm" />
              </SettingRow>
              <SettingRow label="Icon" description="Lucide icon name (e.g. BookOpen, FileText).">
                <Input value={newTypeIcon} onChange={e => setNewTypeIcon(e.target.value)} placeholder="e.g. BookOpen" className="h-11" />
              </SettingRow>
            </CardContent>
            <div className="px-4 pb-4 pt-2">
              <Button
                size="sm"
                className="min-h-[44px] gap-2"
                onClick={handleCreateContentType}
                disabled={creatingType || !newTypeName.trim()}
              >
                {creatingType ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Creating…
                  </span>
                ) : (
                  <><Plus className="size-4" /> Create Content Type</>
                )}
              </Button>
            </div>
          </Card>

          {/* Maintenance */}
          <Card className="border-amber-200 dark:border-amber-800/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Maintenance Mode</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Show a maintenance page to all public visitors. The CMS remains accessible.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {maintenanceMode && <Badge className="bg-amber-500 text-white text-xs">Active</Badge>}
                  <Switch
                    checked={maintenanceMode}
                    onCheckedChange={v => set('maintenance_mode', v ? 'true' : 'false')}
                    aria-label="Toggle maintenance mode"
                  />
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="flex justify-end pb-8">
            <Button className="min-h-[44px] gap-2" onClick={handleSave} disabled={saving}>
              <Save className="size-4" /> Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
