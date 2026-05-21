'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StoreButton as Button } from '@/components/ui/store-button'
import { StoreInput as Input } from '@/components/ui/store-input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { saveStep } from '@/app/(store)/contratar/actions'
import { parseBRL, formatBRL, formatBRLInput, getStepData } from './types'
import { StoreCurrencyInput } from '@/components/ui/store-currency-input'
import type { WizardStepProps } from './types'

type Props = WizardStepProps & {
  nextStep: string
  faturamentoLabel?: string
  hasProdutos?: boolean
}

export function AtividadeFaturamentoStep({ proposalId, proposal, nextStep, faturamentoLabel = 'Faturamento anual', hasProdutos }: Props) {
  const saved = getStepData<Record<string, string>>(proposal, 'atividade-faturamento')
  const [atividade, setAtividade] = useState(saved.atividade ?? '')
  const [faturamentoStr, setFaturamentoStr] = useState(saved.faturamento ? formatBRLInput(Number(saved.faturamento)) : '')
  const [produtos, setProdutos] = useState(saved.produtos ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

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
      if ('error' in res) setError(res.error)
      else router.push(res.redirectTo)
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
        <StoreCurrencyInput value={faturamentoStr} onChange={setFaturamentoStr} />
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
