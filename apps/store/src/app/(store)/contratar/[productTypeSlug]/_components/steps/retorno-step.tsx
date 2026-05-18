'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { finalizeEtapa1 } from '@/app/(store)/contratar/actions'
import type { WizardStepProps } from './types'

type Props = WizardStepProps & { message: string }

export function RetornoStep({ proposalId, message }: Props) {
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    if (!proposalId) return
    startTransition(async () => {
      const res = await finalizeEtapa1(proposalId)
      if (res && 'error' in res) setError(res.error)
      else setDone(true)
    })
  }

  if (done) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <p className="text-base leading-relaxed text-muted-foreground">{message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">
          Seus dados foram salvos. Clique em confirmar para finalizar a etapa de qualificação.
        </p>
      </div>
      {error && <FieldError>{error}</FieldError>}
      <Button className="w-full" onClick={handleConfirm} disabled={isPending}>
        {isPending ? 'Confirmando…' : 'Confirmar'}
      </Button>
    </div>
  )
}
