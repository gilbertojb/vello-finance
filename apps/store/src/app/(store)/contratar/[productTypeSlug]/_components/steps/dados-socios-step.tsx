'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { saveStep } from '@/app/(store)/contratar/actions'
import { getStepData } from './types'
import { SocioFields } from '../shared/socio-fields'
import type { SocioData } from '../shared/socio-fields'
import type { WizardStepProps } from './types'

type Props = WizardStepProps & { nextStep: string; withRg?: boolean; withEstadoCivil?: boolean }

export function DadosSociosStep({ proposalId, proposal, nextStep, withRg, withEstadoCivil = true }: Props) {
  const saved = getStepData<{ socios?: SocioData[] }>(proposal, 'dados-socios')
  const [socios, setSocios] = useState<SocioData[]>(saved.socios ?? [])
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit() {
    if (socios.length === 0) return setError('Informe pelo menos 1 sócio.')
    if (socios.some((s) => !s.nome || !s.cpf || !s.dataNascimento || !s.email)) return setError('Preencha todos os campos dos sócios.')
    setError('')
    startTransition(async () => {
      const res = await saveStep({ proposalId: proposalId!, stepSlug: 'dados-socios', stepData: { socios }, nextStep })
      if ('error' in res) setError(res.error)
      else router.push(res.redirectTo)
    })
  }

  return (
    <div className="space-y-5">
      <SocioFields value={socios} onChange={setSocios} withRg={withRg} withEstadoCivil={withEstadoCivil} />
      {error && <FieldError>{error}</FieldError>}
      <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
    </div>
  )
}
