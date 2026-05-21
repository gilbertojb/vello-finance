'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StoreButton as Button } from '@/components/ui/store-button'
import { StoreInput as Input } from '@/components/ui/store-input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createProposal, saveStep } from '@/app/(store)/contratar/actions'
import { parseBRL, formatBRL, formatBRLInput, getStepData } from '../steps/types'
import { StoreCurrencyInput } from '@/components/ui/store-currency-input'
import { BlockMessage } from '../steps/block-message'
import { RetornoStep } from '../steps/retorno-step'
import { DadosEmpresaPJStep } from '../steps/dados-empresa-pj-step'
import { DadosSociosStep } from '../steps/dados-socios-step'
import type { ProductWizardProps } from '../steps/types'

const TIPOS_RECEBIVEL = ['Maquininha (Cartão de Crédito)', 'Duplicata', 'Nota Fiscal Eletrônica (NF-e)', 'Contrato a Receber']
const MOTIVOS = ['Quitar dívidas pessoais', 'Quitar dívidas da empresa', 'Investir em negócio próprio', 'Reforma ou construção', 'Aquisição de outro imóvel', 'Projetos pessoais', 'Outros']

function AntecipacaoOperacaoStep({ proposalId, productId, productTypeSlug, simulationId, proposal, currentStep }: ProductWizardProps) {
  const saved = getStepData<Record<string, string>>(proposal, 'operacao')
  const [tipoRecebivel, setTipoRecebivel] = useState(saved.tipoRecebivel ?? '')
  const [fundacao, setFundacao] = useState(saved.fundacao ?? '')
  const [faturamentoStr, setFaturamentoStr] = useState(saved.faturamento ? formatBRLInput(Number(saved.faturamento)) : '')
  const [motivo, setMotivo] = useState(saved.motivo ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const blockIdade = fundacao
    ? (new Date().getTime() - new Date(fundacao).getTime()) / (1000 * 60 * 60 * 24 * 365.25) < 3
    : false
  const blockFaturamento = parseBRL(faturamentoStr) > 0 && parseBRL(faturamentoStr) < 120000

  function handleSubmit() {
    if (blockIdade || blockFaturamento) return
    if (!tipoRecebivel || !fundacao || !faturamentoStr || !motivo) return setError('Preencha todos os campos.')
    setError('')
    startTransition(async () => {
      const stepData = { tipoRecebivel, fundacao, faturamento: parseBRL(faturamentoStr), motivo }
      const res = proposalId
        ? await saveStep({ proposalId, stepSlug: 'operacao', stepData, nextStep: 'dados-empresa' })
        : await createProposal({ productId: productId!, productTypeSlug, simulationId: simulationId ?? undefined, stepSlug: 'operacao', stepData, nextStep: 'dados-empresa' })
      if ('error' in res) setError(res.error)
      else router.push(res.redirectTo)
    })
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Tipo de recebível <span className="text-destructive">*</span></FieldLabel>
        <Select value={tipoRecebivel} onValueChange={setTipoRecebivel}>
          <SelectTrigger className="w-full h-11 rounded-lg"><SelectValue placeholder="Selecione…" /></SelectTrigger>
          <SelectContent>
            {TIPOS_RECEBIVEL.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel>Data de abertura do CNPJ <span className="text-destructive">*</span></FieldLabel>
        <Input type="date" value={fundacao} onChange={(e) => setFundacao(e.target.value)} />
        {blockIdade && <BlockMessage message="A empresa precisa ter pelo menos 3 anos de existência para essa linha de crédito." />}
      </Field>

      <Field>
        <FieldLabel>Faturamento dos últimos 12 meses <span className="text-destructive">*</span></FieldLabel>
        <StoreCurrencyInput value={faturamentoStr} onChange={setFaturamentoStr} />
        {blockFaturamento && <BlockMessage message="O faturamento mínimo exigido para essa linha de crédito é de R$ 120 mil." />}
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
      <Button className="w-full" onClick={handleSubmit} disabled={isPending || blockIdade || blockFaturamento}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
    </FieldGroup>
  )
}

export function AntecipacaoRecebiveisWizard({ currentStep, ...props }: ProductWizardProps) {
  switch (currentStep) {
    case 'operacao':
      return <AntecipacaoOperacaoStep {...props} currentStep={currentStep} />
    case 'dados-empresa':
      return <DadosEmpresaPJStep {...props} variant="full" nextStep="dados-socios" />
    case 'dados-socios':
      return <DadosSociosStep {...props} nextStep="retorno" withRg withEstadoCivil={false} />
    case 'retorno':
      return <RetornoStep {...props} message="Obrigado pelas informações! Agora é com a gente, sua proposta já está em análise. Fique de olho no WhatsApp e no seu e-mail." />
    default:
      return null
  }
}
