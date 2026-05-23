'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { StoreButton as Button } from '@/components/ui/store-button'
import { FieldError } from '@/components/ui/field'
import { finalizeEtapa1, finalizeProposal } from '@/app/(store)/contratar/actions'
import { formatBRL } from './types'
import type { WizardStepProps } from './types'

type Props = WizardStepProps & { message: string; skipDocuments?: boolean }

function SimulationSummary({ proposal }: Pick<WizardStepProps, 'proposal'>) {
  const sim = proposal?.simulations as {
    desired_amount?: number | null
    desired_term_months?: number | null
    estimated_rate?: number | null
    estimated_payment?: number | null
  } | null | undefined

  if (!sim?.desired_amount) return null

  const rows = [
    sim.desired_amount != null && { label: 'Crédito solicitado', value: `R$ ${formatBRL(sim.desired_amount)}` },
    sim.desired_term_months != null && { label: 'Parcelas', value: `${sim.desired_term_months}x` },
    sim.estimated_rate != null && { label: 'Juros mensais', value: `${sim.estimated_rate.toFixed(2).replace('.', ',')}% a.m.` },
    sim.estimated_payment != null && { label: 'Valor da parcela', value: `R$ ${formatBRL(sim.estimated_payment)}` },
  ].filter(Boolean) as { label: string; value: string }[]

  if (rows.length === 0) return null

  return (
    <div className="rounded-lg border border-surface-foreground/15 bg-surface p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-foreground/50">Resumo da simulação</p>
      <dl className="space-y-2">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <dt className="text-surface-foreground/70">{label}</dt>
            <dd className="font-semibold text-surface-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function RetornoStep({ proposalId, proposal, message, skipDocuments }: Props) {
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const productName = proposal?.products?.name ?? ''

  function handleConfirm() {
    if (!proposalId) return
    startTransition(async () => {
      const res = skipDocuments
        ? await finalizeProposal(proposalId)
        : await finalizeEtapa1(proposalId)
      if (res && 'error' in res) setError(res.error)
      else setDone(true)
    })
  }

  if (done) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        {productName && (
          <span className="mb-4 inline-flex items-center rounded-full bg-primary/15 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-label text-surface-foreground">
            {productName}
          </span>
        )}
        <h2 className="mb-3 text-xl font-extrabold tracking-tight text-surface-foreground">
          Dados recebidos!
        </h2>
        <p className="text-base leading-relaxed text-surface-foreground/70">{message}</p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-surface-foreground px-8 py-3 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
        >
          Voltar ao início
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {productName && (
        <span className="inline-flex items-center rounded-full bg-primary/15 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-label text-surface-foreground">
          {productName}
        </span>
      )}
      <SimulationSummary proposal={proposal} />
      <div className="rounded-lg border border-surface-foreground/15 bg-surface p-5">
        <p className="text-sm text-surface-foreground">
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
