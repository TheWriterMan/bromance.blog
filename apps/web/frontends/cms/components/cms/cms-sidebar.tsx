'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

const mainNavItems = [
  { href: '/cms/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cms/posts', label: 'Posts', icon: FileText },
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

export function CmsSidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/cms/dashboard') return pathname === href
    if (href === '/cms/settings') return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Header */}
      <SidebarHeader className="p-4">
        <Link href="/cms/dashboard" className="flex items-center gap-2.5 min-h-[44px]">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex-shrink-0">
            <PenLine className="size-4" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground leading-none">Inkwell</span>
            <span className="text-xs text-sidebar-foreground/50 mt-0.5">CMS</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator className="opacity-50" />

      <SidebarContent className="px-2 py-3">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest px-2 mb-1">
            Content
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      className={cn(
                        'min-h-[44px] rounded-lg transition-colors',
                        isActive(item.href)
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium hover:bg-sidebar-primary/90'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                      )}
                      tooltip={item.label}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2 opacity-30" />

        {/* Settings Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] uppercase tracking-widest px-2 mb-1">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      className={cn(
                        'min-h-[44px] rounded-lg transition-colors',
                        isActive(item.href)
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium hover:bg-sidebar-primary/90'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                      )}
                      tooltip={item.label}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <Avatar className="size-8 flex-shrink-0">
            <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop" alt="Sarah Chen" />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">SC</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-xs font-medium text-sidebar-foreground truncate">Sarah Chen</p>
            <p className="text-[11px] text-sidebar-foreground/50 truncate">sarah@inkwell.example.com</p>
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <ThemeToggle />
          </div>
        </div>
        <Link
          href="https://inkwell.example.com"
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
