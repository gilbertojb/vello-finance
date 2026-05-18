'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { saveStep } from '@/app/(store)/contratar/actions'
import { getStepData } from './types'
import { AddressForm } from '../shared/address-form'
import type { AddressData } from '../shared/address-form'
import type { WizardStepProps } from './types'

const EMPTY: AddressData = { cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' }

type Props = WizardStepProps & {
  stepSlug: string
  nextStep: string
  label: string
  showSameAs?: { label: string; sourceStepSlug: string }
}

export function EnderecoStep({ proposalId, proposal, stepSlug, nextStep, label, showSameAs }: Props) {
  const saved = getStepData<AddressData>(proposal, stepSlug)
  const [addr, setAddr] = useState<AddressData>({ ...EMPTY, ...saved })
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const sameAsData = showSameAs ? getStepData<AddressData>(proposal, showSameAs.sourceStepSlug) : undefined

  function handleSubmit() {
    if (!addr.cep || !addr.rua || !addr.numero || !addr.cidade) return setError('Preencha os campos obrigatórios do endereço.')
    setError('')
    startTransition(async () => {
      const res = await saveStep({ proposalId: proposalId!, stepSlug, stepData: addr, nextStep })
      if ('error' in res) setError(res.error)
      else router.push(res.redirectTo)
    })
  }

  return (
    <div className="space-y-5">
      <AddressForm
        label={label}
        value={addr}
        onChange={setAddr}
        showSameAs={sameAsData && showSameAs ? { label: showSameAs.label, data: { ...EMPTY, ...sameAsData } } : undefined}
      />
      {error && <FieldError>{error}</FieldError>}
      <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
    </div>
  )
}
