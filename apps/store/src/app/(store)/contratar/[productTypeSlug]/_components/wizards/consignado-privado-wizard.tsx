'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StoreButton as Button } from '@/components/ui/store-button'
import { StoreInput as Input } from '@/components/ui/store-input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createProposal, saveStep } from '@/app/(store)/contratar/actions'
import { getStepData } from '../steps/types'
import { ToggleGroup } from '../steps/toggle-group'
import { BlockMessage } from '../steps/block-message'
import { RetornoStep } from '../steps/retorno-step'
import { DadosPessoaisPFStep } from '../steps/dados-pessoais-pf-step'
import { DadosBancariosEtapa2Step } from '../etapa2/dados-bancarios-step'
import type { ProductWizardProps } from '../steps/types'

const TEMPOS_EMPRESA_CLT = ['Menos de 6 meses', '6 meses a 1 ano', '1 a 3 anos', '3 a 5 anos', 'Mais de 5 anos']

function PreFiltroStep({ proposalId, productId, productTypeSlug, simulationId, proposal, currentStep }: ProductWizardProps) {
  const saved = getStepData<Record<string, string>>(proposal, 'pre-filtro')
  const [clt, setClt] = useState(saved.clt ?? '')
  const [vinculo, setVinculo] = useState(saved.vinculo ?? '')
  const [tempo, setTempo] = useState(saved.tempo ?? '')
  const [idade, setIdade] = useState(saved.idade ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const blocked = clt === 'Não' || vinculo === 'Não' || tempo === 'Não' || idade === 'Não'
  const allSim = clt === 'Sim' && vinculo === 'Sim' && tempo === 'Sim' && idade === 'Sim'
  const router = useRouter()

  function handleSubmit() {
    if (blocked || !allSim) return
    startTransition(async () => {
      let clientName: string | undefined
      let clientPhone: string | undefined
      try {
        const sim = JSON.parse(sessionStorage.getItem('sim:consignado') ?? '{}')
        clientName = sim.nome || undefined
        clientPhone = sim.whatsapp || undefined
      } catch { /* ignore */ }

      const stepData = { clt, vinculo, tempo, idade }
      const res = proposalId
        ? await saveStep({ proposalId, stepSlug: 'pre-filtro', stepData, nextStep: 'dados-pessoais' })
        : await createProposal({ productId: productId!, productTypeSlug, simulationId: simulationId ?? undefined, stepSlug: 'pre-filtro', stepData, nextStep: 'dados-pessoais', clientName, clientPhone })
      if ('error' in res) setError(res.error)
      else router.push(res.redirectTo)
    })
  }

  const pergunta = (label: string, val: string, set: (v: string) => void) => (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <ToggleGroup options={['Sim', 'Não']} value={val} onChange={set} />
    </div>
  )

  return (
    <div className="space-y-5">
      {pergunta('Você trabalha com carteira assinada (CLT)?', clt, setClt)}
      {pergunta('Seu vínculo está ativo (sem aviso prévio)?', vinculo, setVinculo)}
      {pergunta('Tempo de empresa igual ou superior a 6 meses?', tempo, setTempo)}
      {pergunta('Sua idade está entre 21 e 65 anos?', idade, setIdade)}
      {blocked && <BlockMessage message="Infelizmente, não atende aos requisitos mínimos para esta modalidade de crédito no momento. Mas existem outras opções disponíveis para você!" />}
      {error && <FieldError>{error}</FieldError>}
      <Button className="w-full" onClick={handleSubmit} disabled={isPending || !allSim}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
    </div>
  )
}

function DadosProfissionaisStep({ proposalId, proposal }: ProductWizardProps) {
  const saved = getStepData<Record<string, string>>(proposal, 'dados-profissionais')
  const [empresa, setEmpresa] = useState(saved.empresa ?? '')
  const [tempoEmpresa, setTempoEmpresa] = useState(saved.tempoEmpresa ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const blockTempo = tempoEmpresa === 'Menos de 6 meses'
  const router = useRouter()

  function handleSubmit() {
    if (blockTempo || !empresa || !tempoEmpresa) return setError('Preencha todos os campos.')
    setError('')
    startTransition(async () => {
      const res = await saveStep({ proposalId: proposalId!, stepSlug: 'dados-profissionais', stepData: { empresa, tempoEmpresa, tipoContrato: 'CLT (Carteira Assinada)' }, nextStep: 'dados-bancarios' })
      if ('error' in res) setError(res.error)
      else router.push(res.redirectTo)
    })
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Empresa atual <span className="text-destructive">*</span></FieldLabel>
        <Input placeholder="Nome da empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
      </Field>

      <Field>
        <FieldLabel>Tempo de empresa <span className="text-destructive">*</span></FieldLabel>
        <Select value={tempoEmpresa} onValueChange={setTempoEmpresa}>
          <SelectTrigger className="w-full h-11 rounded-lg"><SelectValue placeholder="Selecione…" /></SelectTrigger>
          <SelectContent>
            {TEMPOS_EMPRESA_CLT.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        {blockTempo && <BlockMessage message="É necessário ter pelo menos 6 meses de empresa para esta linha de crédito." />}
      </Field>

      <Field>
        <FieldLabel>Tipo de contrato</FieldLabel>
        <Input value="CLT (Carteira Assinada)" readOnly className="opacity-60" />
      </Field>

      {error && <FieldError>{error}</FieldError>}
      <Button className="w-full" onClick={handleSubmit} disabled={isPending || blockTempo}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
    </FieldGroup>
  )
}

export function ConsignadoPrivadoWizard({ currentStep, ...props }: ProductWizardProps) {
  switch (currentStep) {
    case 'pre-filtro':
      return <PreFiltroStep {...props} currentStep={currentStep} />
    case 'dados-pessoais':
      return <DadosPessoaisPFStep {...props} nextStep="dados-profissionais" />
    case 'dados-profissionais':
      return <DadosProfissionaisStep {...props} currentStep={currentStep} />
    case 'dados-bancarios':
      return <DadosBancariosEtapa2Step {...props} nextStep="retorno" />
    case 'retorno':
      return <RetornoStep {...props} skipDocuments message="Muito obrigado! Recebemos os seus dados e vamos iniciar a análise. Fique atento ao WhatsApp e e-mail, em breve você recebe um retorno." />
    default:
      return null
  }
}
