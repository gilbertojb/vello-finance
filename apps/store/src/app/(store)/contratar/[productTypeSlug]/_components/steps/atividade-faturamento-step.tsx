'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { saveStep } from '@/app/(store)/contratar/actions'
import { parseBRL, formatBRL, getStepData } from './types'
import type { WizardStepProps } from './types'

type Props = WizardStepProps & {
  nextStep: string
  faturamentoLabel?: string
  hasProdutos?: boolean
}

export function AtividadeFaturamentoStep({ proposalId, proposal, nextStep, faturamentoLabel = 'Faturamento anual', hasProdutos }: Props) {
  const saved = getStepData<Record<string, string>>(proposal, 'atividade-faturamento')
  const [atividade, setAtividade] = useState(saved.atividade ?? '')
  const [faturamentoStr, setFaturamentoStr] = useState(saved.faturamento ? formatBRL(Number(saved.faturamento)) : '')
  const [produtos, setProdutos] = useState(saved.produtos ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!atividade || !faturamentoStr) return setError('Preencha todos os campos obrigatórios.')
    setError('')
    startTransition(async () => {
      const res = await saveStep({
        proposalId: proposalId!,
        stepSlug: 'atividade-faturamento',
        stepData: { atividade, faturamento: parseBRL(faturamentoStr), produtos },
        nextStep,
      })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Atividade da empresa <span className="text-destructive">*</span></FieldLabel>
        <Input placeholder="Descreva a atividade principal" value={atividade} onChange={(e) => setAtividade(e.target.value)} />
      </Field>

      <Field>
        <FieldLabel>{faturamentoLabel} <span className="text-destructive">*</span></FieldLabel>
        <div className="flex items-center rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <span className="select-none pl-3 pr-2 text-sm text-muted-foreground">R$</span>
          <input
            type="text"
            inputMode="decimal"
            value={faturamentoStr}
            placeholder="0,00"
            className="flex-1 bg-transparent py-2 pr-3 text-sm outline-none placeholder:text-muted-foreground"
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '')
              setFaturamentoStr(formatBRL(parseInt(digits || '0') / 100))
            }}
          />
        </div>
      </Field>

      {hasProdutos && (
        <Field>
          <FieldLabel>Produtos ou serviços</FieldLabel>
          <Input placeholder="Descreva seus produtos/serviços" value={produtos} onChange={(e) => setProdutos(e.target.value)} />
        </Field>
      )}

      {error && <FieldError>{error}</FieldError>}
      <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
    </FieldGroup>
  )
}
