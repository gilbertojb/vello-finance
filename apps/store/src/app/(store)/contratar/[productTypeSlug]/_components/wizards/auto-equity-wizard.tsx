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
import type { ProductWizardProps } from '../steps/types'

const TIPOS_VEICULO = ['Carro', 'Caminhão', 'Moto']
const MOTIVOS = ['Quitar dívidas pessoais', 'Quitar dívidas da empresa', 'Investir em negócio próprio', 'Reforma ou construção', 'Aquisição de outro imóvel', 'Projetos pessoais', 'Outros']
const currentYear = new Date().getFullYear()
const ANOS = Array.from({ length: currentYear - 1959 }, (_, i) => String(currentYear - i))

function AutoEquityOperacaoStep({ proposalId, productId, productTypeSlug, simulationId, proposal, currentStep }: ProductWizardProps) {
  const saved = getStepData<Record<string, string>>(proposal, 'operacao')
  const [tipoVeiculo, setTipoVeiculo] = useState(saved.tipoVeiculo ?? '')
  const [financiado, setFinanciado] = useState(saved.financiado ?? '')
  const [placa, setPlaca] = useState(saved.placa ?? '')
  const [ano, setAno] = useState(saved.ano ?? '')
  const [motivo, setMotivo] = useState(saved.motivo ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const blockFinanciado = financiado === 'Sim'
  const blockAno = ano ? currentYear - Number(ano) > 17 : false

  function handleSubmit() {
    if (blockFinanciado || blockAno) return
    if (!tipoVeiculo || !financiado || !placa || !ano || !motivo) return setError('Preencha todos os campos.')
    if (!/^[A-Z]{3}[\d]{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/i.test(placa.replace('-', ''))) return setError('Formato de placa inválido.')
    setError('')
    startTransition(async () => {
      const stepData = { tipoVeiculo, financiado, placa: placa.toUpperCase(), ano, motivo }
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
        <FieldLabel>O veículo está financiado? <span className="text-destructive">*</span></FieldLabel>
        <Select value={financiado} onValueChange={setFinanciado}>
          <SelectTrigger className="w-full h-11 rounded-lg"><SelectValue placeholder="Selecione…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Não">Não</SelectItem>
            <SelectItem value="Sim">Sim</SelectItem>
          </SelectContent>
        </Select>
        {blockFinanciado && <BlockMessage message="No momento, não conseguimos seguir pois o veículo ainda possui um financiamento ativo. Para avançarmos, ele precisa estar totalmente quitado." />}
      </Field>

      <Field>
        <FieldLabel>Placa do veículo <span className="text-destructive">*</span></FieldLabel>
        <Input
          type="text"
          placeholder="ABC-1234 ou ABC1D23"
          value={placa}
          maxLength={8}
          onChange={(e) => setPlaca(e.target.value.toUpperCase())}
        />
      </Field>

      <Field>
        <FieldLabel>Ano de fabricação <span className="text-destructive">*</span></FieldLabel>
        <Select value={ano} onValueChange={setAno}>
          <SelectTrigger className="w-full h-11 rounded-lg"><SelectValue placeholder="Selecione…" /></SelectTrigger>
          <SelectContent>
            {ANOS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        {blockAno && <BlockMessage message="Este veículo não atende aos requisitos mínimos de ano de fabricação." />}
      </Field>

      <Field>
        <FieldLabel>Motivo do crédito <span className="text-destructive">*</span></FieldLabel>
        <Select value={motivo} onValueChange={setMotivo}>
          <SelectTrigger className="w-full h-11 rounded-lg"><SelectValue placeholder="Selecione…" /></SelectTrigger>
          <SelectContent>
            {MOTIVOS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      {error && <FieldError>{error}</FieldError>}
      <Button className="w-full" onClick={handleSubmit} disabled={isPending || blockFinanciado || blockAno}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
    </FieldGroup>
  )
}

export function AutoEquityWizard({ currentStep, ...props }: ProductWizardProps) {
  switch (currentStep) {
    case 'operacao':
      return <AutoEquityOperacaoStep {...props} currentStep={currentStep} />
    case 'dados-pessoais':
      return <DadosPessoaisPFStep {...props} nextStep="renda-ocupacao" withNomeMae />
    case 'renda-ocupacao':
      return <RendaOcupacaoStep {...props} nextStep="retorno" />
    case 'retorno':
      return <RetornoStep {...props} message="Tudo certo por aqui! Recebemos suas informações e já iniciamos a análise. Em breve você vai receber um retorno no WhatsApp e no e-mail." />
    default:
      return null
  }
}
