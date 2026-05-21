'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StoreButton as Button } from '@/components/ui/store-button'
import { StoreInput as Input } from '@/components/ui/store-input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createProposal, saveStep } from '@/app/(store)/contratar/actions'
import { getStepData } from '../steps/types'
import { BlockMessage } from '../steps/block-message'
import { RetornoStep } from '../steps/retorno-step'
import { DadosPessoaisPFStep } from '../steps/dados-pessoais-pf-step'
import { RendaOcupacaoStep } from '../steps/renda-ocupacao-step'
import { DadosVendedorStep } from '../steps/dados-vendedor-step'
import type { ProductWizardProps } from '../steps/types'

const TIPOS_VEICULO = ['Carro', 'Moto', 'Caminhão', 'Van']

function FinanciamentoVeiculoOperacaoStep({ proposalId, productId, productTypeSlug, simulationId, proposal, currentStep }: ProductWizardProps) {
  const saved = getStepData<Record<string, string>>(proposal, 'operacao')
  const [tipoVeiculo, setTipoVeiculo] = useState(saved.tipoVeiculo ?? '')
  const [financiado, setFinanciado] = useState(saved.financiado ?? '')
  const [placa, setPlaca] = useState(saved.placa ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const blockFinanciado = financiado === 'Sim'
  const router = useRouter()

  function handleSubmit() {
    if (blockFinanciado) return
    if (!tipoVeiculo || !financiado || !placa) return setError('Preencha todos os campos.')
    setError('')
    startTransition(async () => {
      const stepData = { tipoVeiculo, financiado, placa: placa.toUpperCase() }
      const res = proposalId
        ? await saveStep({ proposalId, stepSlug: 'operacao', stepData, nextStep: 'dados-pessoais' })
        : await createProposal({ productId: productId!, productTypeSlug, simulationId: simulationId ?? undefined, stepSlug: 'operacao', stepData, nextStep: 'dados-pessoais' })
      if ('error' in res) setError(res.error)
      else router.push(res.redirectTo)
    })
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Tipo de veículo <span className="text-destructive">*</span></FieldLabel>
        <Select value={tipoVeiculo} onValueChange={setTipoVeiculo}>
          <SelectTrigger className="w-full h-11 rounded-lg"><SelectValue placeholder="Selecione…" /></SelectTrigger>
          <SelectContent>
            {TIPOS_VEICULO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel>O veículo já está financiado? <span className="text-destructive">*</span></FieldLabel>
        <Select value={financiado} onValueChange={setFinanciado}>
          <SelectTrigger className="w-full h-11 rounded-lg"><SelectValue placeholder="Selecione…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Não">Não</SelectItem>
            <SelectItem value="Sim">Sim</SelectItem>
          </SelectContent>
        </Select>
        {blockFinanciado && <BlockMessage message="No momento, não conseguimos seguir pois o veículo já possui um financiamento ativo. Para avançarmos, ele precisa estar totalmente quitado." />}
      </Field>

      <Field>
        <FieldLabel>Placa do veículo <span className="text-destructive">*</span></FieldLabel>
        <Input
          type="text"
          placeholder="ABC-1234"
          value={placa}
          maxLength={8}
          onChange={(e) => setPlaca(e.target.value.toUpperCase())}
        />
      </Field>

      {error && <FieldError>{error}</FieldError>}
      <Button className="w-full" onClick={handleSubmit} disabled={isPending || blockFinanciado}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
    </FieldGroup>
  )
}

export function FinanciamentoVeiculoWizard({ currentStep, ...props }: ProductWizardProps) {
  switch (currentStep) {
    case 'operacao':
      return <FinanciamentoVeiculoOperacaoStep {...props} currentStep={currentStep} />
    case 'dados-pessoais':
      return <DadosPessoaisPFStep {...props} nextStep="renda-ocupacao" withNomeMae />
    case 'renda-ocupacao':
      return <RendaOcupacaoStep {...props} nextStep="dados-vendedor" />
    case 'dados-vendedor':
      return <DadosVendedorStep {...props} nextStep="retorno" />
    case 'retorno':
      return <RetornoStep {...props} message="Obrigado pelas informações! Em breve teremos o retorno da sua proposta, fique atento ao WhatsApp e e-mail." />
    default:
      return null
  }
}
