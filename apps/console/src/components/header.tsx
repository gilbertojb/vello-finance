import { Bell, Search } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function Header() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4 transition-[width,height] ease-linear">
      <div className="flex flex-1 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="my-2 h-4" />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground w-52">
          <Search className="size-3.5 shrink-0" />
          <span>Buscar simulações, CPF, e-m...</span>
          <span className="ml-auto rounded border border-border px-1 text-[10px]">⌘K</span>
        </div>
        <button className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell className="size-4" />
          <span className="absolute right-1 top-1 flex size-2 items-center justify-center rounded-full bg-primary" />
        </button>
      </div>
    </header>
  )
}
