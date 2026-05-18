'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { saveStep } from '@/app/(store)/contratar/actions'
import { BankDataForm } from '../shared/bank-data-form'
import type { BankData } from '../shared/bank-data-form'
import type { WizardStepProps } from '../steps/types'

const EMPTY: BankData = { banco: '', agencia: '', conta: '', pix: '', confirmaTitularidade: false }

type Props = WizardStepProps & { nextStep: string; titularLabel?: string }

export function DadosBancariosEtapa2Step({ proposalId, proposal, nextStep, titularLabel }: Props) {
  const saved = ((proposal?.form_data as Record<string, unknown>)?.['dados-bancarios'] ?? {}) as Partial<BankData>
  const [bankData, setBankData] = useState<BankData>({ ...EMPTY, ...saved })
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!bankData.banco || !bankData.agencia || !bankData.conta) return setError('Preencha banco, agência e conta.')
    if (!bankData.confirmaTitularidade) return setError('A conta informada não corresponde ao titular do crédito. Utilize uma conta bancária em seu nome.')
    setError('')
    startTransition(async () => {
      const res = await saveStep({ proposalId: proposalId!, stepSlug: 'dados-bancarios', stepData: bankData, nextStep })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <BankDataForm value={bankData} onChange={setBankData} titularLabel={titularLabel} error={error} />
      {error && <FieldError>{error}</FieldError>}
      <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
    </div>
  )
}
