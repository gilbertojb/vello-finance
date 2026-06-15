'use client'

import { useTransition } from 'react'
import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { logoutClientAction } from '@/app/(store)/meus-documentos/actions'

interface ClientHeaderProps {
  title: string
  name?: string | null
  cpfDisplay?: string | null
}

export function ClientHeader({ title, name, cpfDisplay }: ClientHeaderProps) {
  const [pending, startTransition] = useTransition()
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
        {(name || cpfDisplay) && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {name && (
              <span className="text-sm font-medium text-foreground capitalize">{name.toLowerCase()}</span>
            )}
            {name && cpfDisplay && (
              <span className="text-muted-foreground/50 text-xs">·</span>
            )}
            {cpfDisplay && (
              <span className="font-mono text-xs text-muted-foreground">{cpfDisplay}</span>
            )}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => startTransition(() => logoutClientAction())}
        disabled={pending}
      >
        <LogOut className="size-4" />
        Sair
      </Button>
    </div>
  )
}
