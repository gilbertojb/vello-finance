'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { deleteTrigger } from '../pipeline-actions'

const EVENT_LABEL: Record<string, string> = {
  on_enter: 'Ao entrar',
  on_exit: 'Ao sair',
  on_timeout: 'Timeout',
}

type Props = {
  trigger: {
    id: string
    event_type: string
    webhook_url: string
    timeout_unit?: string | null
    timeout_value?: number | null
  }
  productTypeId: string
}

export function StageTriggerRow({ trigger, productTypeId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTrigger(trigger.id, productTypeId)
      if (result.success) {
        router.refresh()
      } else {
        toast.error(result.message || 'Erro ao remover trigger.')
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-2 py-1 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0 text-xs font-medium bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
          {EVENT_LABEL[trigger.event_type] ?? trigger.event_type}
          {trigger.event_type === 'on_timeout' &&
            trigger.timeout_value &&
            trigger.timeout_unit &&
            ` (${trigger.timeout_value} ${trigger.timeout_unit === 'minutes' ? 'min' : trigger.timeout_unit === 'hours' ? 'h' : 'd'})`}
        </span>
        <span className="text-muted-foreground truncate font-mono text-xs">
          {trigger.webhook_url}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={handleDelete}
        className="shrink-0 h-7 w-7 p-0 text-destructive hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}
