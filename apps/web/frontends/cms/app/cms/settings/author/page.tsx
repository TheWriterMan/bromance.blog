'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Camera,
  Globe,
  ExternalLink,
  MapPin,
  User,
  Mail,
  Link2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/cms/page-header'
import { MOCK_AUTHOR } from '@/lib/mock-data'
import { toast } from 'sonner'

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 py-4">
      <div className="sm:w-48 flex-shrink-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function InputWithIcon({
  icon: Icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ElementType
}) {
  return (
    <div className="relative">
      <Icon
        className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
        aria-hidden="true"
      />
      <Input {...props} className="h-11 pl-9" />
    </div>
  )
}

export default function AuthorProfilePage() {
  const [author, setAuthor] = useState(MOCK_AUTHOR)
  const [saving, setSaving] = useState(false)

  function set(key: keyof typeof author, value: string) {
    setAuthor((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 700))
    setSaving(false)
    toast.success('Author profile saved')
  }

  const initials = author.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Author Profile"
        description="Your public author information"
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
                Save Profile
              </>
            )}
          </Button>
        }
      />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-2xl space-y-6">

          {/* Back link */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground -ml-2 h-9"
            render={<Link href="/cms/settings" />}
          >
            <ArrowLeft className="size-4" />
            Site Settings
          </Button>

          {/* Avatar card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <Avatar className="size-20">
                    <AvatarImage src={author.avatar} alt={author.displayName} />
                    <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <button
                    className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                    aria-label="Change avatar photo"
                    onClick={() => toast.info('In production, this would open a file picker')}
                  >
                    <Camera className="size-3.5" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{author.displayName}</p>
                  <p className="text-xs text-muted-foreground">{author.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[10px]">{author.location}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Identity</CardTitle>
              <CardDescription className="text-xs">
                Your name and email as displayed publicly.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0 px-4">
              <SettingRow label="Display Name" description="Shown on published posts.">
                <InputWithIcon
                  icon={User}
                  value={author.displayName}
                  onChange={(e) => set('displayName', e.target.value)}
                  placeholder="Your name"
                />
              </SettingRow>
              <SettingRow label="Username" description="Used in author URLs.">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                  <Input
                    value={author.name}
                    onChange={(e) => set('name', e.target.value)}
                    className="h-11 pl-7 font-mono text-sm"
                    placeholder="username"
                  />
                </div>
              </SettingRow>
              <SettingRow label="Email" description="Your contact email (not shown publicly).">
                <InputWithIcon
                  icon={Mail}
                  type="email"
                  value={author.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="you@example.com"
                />
              </SettingRow>
              <SettingRow label="Pronouns" description="Shown in your author bio.">
                <Input
                  value={author.pronouns}
                  onChange={(e) => set('pronouns', e.target.value)}
                  className="h-11"
                  placeholder="e.g. she/her"
                />
              </SettingRow>
              <SettingRow label="Location" description="City or region you are based in.">
                <InputWithIcon
                  icon={MapPin}
                  value={author.location}
                  onChange={(e) => set('location', e.target.value)}
                  placeholder="San Francisco, CA"
                />
              </SettingRow>
            </CardContent>
          </Card>

          {/* Bio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Bio</CardTitle>
              <CardDescription className="text-xs">
                A short introduction shown on your author page and posts.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 px-4 pb-4">
              <Textarea
                value={author.bio}
                onChange={(e) => set('bio', e.target.value)}
                placeholder="Write a short bio…"
                className="resize-none text-sm min-h-[100px] mt-2"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {author.bio.length} / 300 characters recommended
              </p>
            </CardContent>
          </Card>

          {/* Social links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Social Links</CardTitle>
              <CardDescription className="text-xs">
                Links shown on your author profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0 px-4">
              <SettingRow label="Website">
                <InputWithIcon
                  icon={Globe}
                  value={author.website}
                  onChange={(e) => set('website', e.target.value)}
                  placeholder="https://yoursite.com"
                  type="url"
                />
              </SettingRow>
              <SettingRow label="Twitter / X">
                <InputWithIcon
                  icon={ExternalLink}
                  value={author.twitter}
                  onChange={(e) => set('twitter', e.target.value)}
                  placeholder="@handle"
                />
              </SettingRow>
              <SettingRow label="LinkedIn">
                <InputWithIcon
                  icon={Link2}
                  value={author.linkedin}
                  onChange={(e) => set('linkedin', e.target.value)}
                  placeholder="linkedin.com/in/yourprofile"
                />
              </SettingRow>
            </CardContent>
          </Card>

          <div className="flex justify-end pb-8">
            <Button
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
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
