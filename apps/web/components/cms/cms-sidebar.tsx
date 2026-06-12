'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Trash2,
  CalendarDays,
  ImageIcon,
  FolderOpen,
  Settings,
  UserCircle,
  HardDrive,
  ExternalLink,
  PenLine,
  BookOpen,
  BookMarked,
  Newspaper,
  Library,
  type LucideProps,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from './theme-toggle'
import { cn } from '@/lib/utils'
import { fetchContentTypes, type ContentType } from '@/lib/cms-api'

// ── Icon registry ─────────────────────────────────────────────────────────────
type IconComponent = React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>

const ICON_MAP: Record<string, IconComponent> = {
  BookOpen,
  BookMarked,
  FileText,
  Newspaper,
  Library,
  FolderOpen,
}

function getIcon(name: string | null | undefined): IconComponent {
  if (name && ICON_MAP[name]) return ICON_MAP[name]
  return FileText
}

// ── Static nav items ──────────────────────────────────────────────────────────
const staticNavItems = [
  { href: '/cms/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cms/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/cms/media', label: 'Media', icon: ImageIcon },
  { href: '/cms/categories', label: 'Categories', icon: FolderOpen },
  { href: '/cms/trash', label: 'Trash', icon: Trash2 },
]

const settingsNavItems = [
  { href: '/cms/settings', label: 'Site Settings', icon: Settings },
  { href: '/cms/settings/author', label: 'Author Profile', icon: UserCircle },
  { href: '/cms/settings/backups', label: 'Backups', icon: HardDrive },
]

interface AuthorInfo {
  displayName: string
  avatarUrl: string | null
}

// ── NavItem component ─────────────────────────────────────────────────────────
function NavItem({ href, label, icon: Icon, isActive }: {
  href: string
  label: string
  icon: IconComponent
  isActive: boolean
}) {
  return (
    <SidebarMenuItem>
      <Link href={href}>
        <SidebarMenuButton
          isActive={isActive}
          className={cn(
            'min-h-[44px] rounded-lg transition-colors',
            isActive
              ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium hover:bg-sidebar-primary/90'
              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
          )}
          tooltip={label}
        >
          <Icon className="size-4" />
          <span>{label}</span>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function CmsSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [author, setAuthor] = useState<AuthorInfo>({ displayName: '', avatarUrl: null })
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])

  useEffect(() => {
    fetch('/api/authors')
      .then(r => r.json())
      .then(data => setAuthor({ displayName: data.display_name || 'Author', avatarUrl: data.avatar_url }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchContentTypes()
      .then(setContentTypes)
      .catch(() => {})
  }, [])

  function isActive(href: string, typeKey?: string) {
    if (href === '/cms/dashboard') return pathname === href
    if (href === '/cms/settings') return pathname === href
    if (typeKey && pathname.startsWith('/cms/posts')) {
      return searchParams.get('type') === typeKey
    }
    return pathname.startsWith(href)
  }

  function isCollectionsActive(typeKey: string) {
    return pathname.startsWith('/cms/collections') && searchParams.get('type') === typeKey
  }

  const initials = author.displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <Link href="/cms/dashboard" className="flex items-center gap-2.5 min-h-[44px]">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex-shrink-0">
            <PenLine className="size-4" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground leading-none">Bromance</span>
            <span className="text-xs text-sidebar-foreground/50 mt-0.5">CMS</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator className="opacity-50" />

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest px-2 mb-1">
            Content
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dashboard */}
              <NavItem
                href="/cms/dashboard"
                label="Dashboard"
                icon={LayoutDashboard}
                isActive={pathname === '/cms/dashboard'}
              />

              {/* Dynamic content type entries */}
              {contentTypes.map(ct => {
                const Icon = getIcon(ct.icon)
                const postsHref = `/cms/posts?type=${ct.key}`
                const active = isActive('/cms/posts', ct.key)
                return (
                  <div key={ct.id}>
                    <NavItem
                      href={postsHref}
                      label={ct.name}
                      icon={Icon}
                      isActive={active}
                    />
                    {ct.hasCollections && (
                      <SidebarMenuItem>
                        <Link href={`/cms/collections?type=${ct.key}`}>
                          <SidebarMenuButton
                            isActive={isCollectionsActive(ct.key)}
                            className={cn(
                              'min-h-[40px] rounded-lg transition-colors ml-4 text-xs',
                              isCollectionsActive(ct.key)
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium hover:bg-sidebar-primary/90'
                                : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                            )}
                            tooltip={`${ct.name} Works`}
                          >
                            <Library className="size-3.5" />
                            <span>→ {ct.name} Works</span>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                    )}
                  </div>
                )
              })}

              {/* Static items: Calendar, Media, Categories, Trash */}
              {staticNavItems.slice(1).map(item => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isActive(item.href)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2 opacity-30" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest px-2 mb-1">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map(item => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isActive(item.href)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <Avatar className="size-8 flex-shrink-0">
            {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt={author.displayName} />}
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
              {initials || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {author.displayName || 'Author'}
            </p>
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <ThemeToggle />
          </div>
        </div>
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="group-data-[collapsible=icon]:hidden mt-2 flex items-center gap-1.5 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors min-h-[44px] px-1"
        >
          <ExternalLink className="size-3" />
          <span>View Site</span>
        </Link>
      </SidebarFooter>
    </Sidebar>
  )
}
