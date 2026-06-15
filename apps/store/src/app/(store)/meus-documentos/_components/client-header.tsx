'use client'

import { useTransition } from 'react'
import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { logoutClientAction } from '@/app/(store)/meus-documentos/actions'

export function ClientHeader({ title }: { title: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
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
