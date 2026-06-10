import { ReactNode } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex h-14 items-center gap-2 border-b border-border px-4 sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
      <SidebarTrigger className="size-11 -ml-1 text-muted-foreground hover:text-foreground" />
      <Separator orientation="vertical" className="h-4 mx-1" />
      <div className="flex flex-1 items-center justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground truncate hidden sm:block">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
