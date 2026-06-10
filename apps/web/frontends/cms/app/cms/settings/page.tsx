'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Save, Globe, ChevronRight, UserCircle, HardDrive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/cms/page-header'
import { MOCK_SITE_SETTINGS } from '@/lib/mock-data'
import { toast } from 'sonner'

const TIMEZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
]

const LOCALES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
  { value: 'ja-JP', label: 'Japanese' },
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
  const [settings, setSettings] = useState(MOCK_SITE_SETTINGS)
  const [saving, setSaving] = useState(false)

  function set(key: keyof typeof settings, value: string | number | boolean) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 700))
    setSaving(false)
    toast.success('Site settings saved')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Site Settings"
        description="Manage your blog configuration"
        actions={
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
                <Save className="size-4" data-icon="inline-start" />
                Save Changes
              </>
            )}
          </Button>
        }
      />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-2xl space-y-6">

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
                <Input value={settings.siteName} onChange={e => set('siteName', e.target.value)} className="h-11" />
              </SettingRow>
              <SettingRow label="Tagline" description="A short, catchy phrase about your blog.">
                <Input value={settings.tagline} onChange={e => set('tagline', e.target.value)} className="h-11" />
              </SettingRow>
              <SettingRow label="Description" description="Used for SEO meta description.">
                <Textarea value={settings.description} onChange={e => set('description', e.target.value)} className="resize-none text-sm min-h-[80px]" />
              </SettingRow>
              <SettingRow label="Copyright Text" description="Shown in the site footer.">
                <Input value={settings.copyright} onChange={e => set('copyright', e.target.value)} className="h-11" />
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
                  <Input value={settings.url} onChange={e => set('url', e.target.value)} className="h-11 pl-9" />
                </div>
              </SettingRow>
              <SettingRow label="Language" description="Primary language for your content.">
                <Select
                  value={settings.locale}
                  onValueChange={v => { if (v) set('locale', v) }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCALES.map(l => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="Timezone" description="Used for scheduling and timestamps.">
                <Select
                  value={settings.timezone}
                  onValueChange={v => { if (v) set('timezone', v) }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>
            </CardContent>
          </Card>

          {/* Reading */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Reading</CardTitle>
              <CardDescription className="text-xs">Control how your posts are displayed.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0 px-4">
              <SettingRow label="Posts Per Page" description="Number of posts shown per archive page.">
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={settings.postsPerPage}
                  onChange={e => set('postsPerPage', parseInt(e.target.value) || 10)}
                  className="h-11 w-32"
                />
              </SettingRow>
            </CardContent>
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
                  {settings.maintenanceMode && (
                    <Badge className="bg-amber-500 text-white text-xs">Active</Badge>
                  )}
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={v => set('maintenanceMode', v)}
                    aria-label="Toggle maintenance mode"
                  />
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="flex justify-end pb-8">
            <Button className="min-h-[44px] gap-2" onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving…
                </span>
              ) : (
                <>
                  <Save className="size-4" data-icon="inline-start" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
