'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createProposal, saveStep } from '@/app/(store)/contratar/actions'
import { parseBRL, formatBRL, getStepData } from '../steps/types'
import { BlockMessage } from '../steps/block-message'
import { RetornoStep } from '../steps/retorno-step'
import { DadosEmpresaPJStep } from '../steps/dados-empresa-pj-step'
import { DadosSociosStep } from '../steps/dados-socios-step'
import type { ProductWizardProps } from '../steps/types'

const TIPOS_EMPRESA = ['LTDA', 'EPP', 'S.A.', 'Outros', 'MEI']
const MOTIVOS = ['Quitar dívidas pessoais', 'Quitar dívidas da empresa', 'Investir em negócio próprio', 'Reforma ou construção', 'Aquisição de outro imóvel', 'Projetos pessoais', 'Outros']
const TIPOS_GARANTIA = ['Duplicatas', 'Cartões de Crédito', 'Aplicações Financeiras', 'Domicílio Simples', 'Imóvel Empresarial', 'Recebíveis']

function CapitalGiroOperacaoStep({ proposalId, productId, productTypeSlug, simulationId, proposal, currentStep }: ProductWizardProps) {
  const saved = getStepData<Record<string, string>>(proposal, 'operacao')
  const [tipoEmpresa, setTipoEmpresa] = useState(saved.tipoEmpresa ?? '')
  const [fundacao, setFundacao] = useState(saved.fundacao ?? '')
  const [faturamentoStr, setFaturamentoStr] = useState(saved.faturamento ? formatBRL(Number(saved.faturamento)) : '')
  const [motivo, setMotivo] = useState(saved.motivo ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const blockMei = tipoEmpresa === 'MEI'
  const blockIdade = fundacao
    ? (new Date().getTime() - new Date(fundacao).getTime()) / (1000 * 60 * 60 * 24 * 365.25) < 3
    : false
  const blockFaturamento = parseBRL(faturamentoStr) > 0 && parseBRL(faturamentoStr) < 250000

  function handleSubmit() {
    if (blockMei || blockIdade || blockFaturamento) return
    if (!tipoEmpresa || !fundacao || !faturamentoStr || !motivo) return setError('Preencha todos os campos.')
    setError('')
    startTransition(async () => {
      const stepData = { tipoEmpresa, fundacao, faturamento: parseBRL(faturamentoStr), motivo }
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
        <FieldLabel>Tipo de empresa <span className="text-destructive">*</span></FieldLabel>
        <Select value={tipoEmpresa} onValueChange={setTipoEmpresa}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Selecione…" /></SelectTrigger>
          <SelectContent>
            {TIPOS_EMPRESA.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        {blockMei && <BlockMessage message="Esta linha de crédito não está disponível para MEI." />}
      </Field>

      <Field>
        <FieldLabel>Data de abertura do CNPJ <span className="text-destructive">*</span></FieldLabel>
        <Input type="date" value={fundacao} onChange={(e) => setFundacao(e.target.value)} />
        {blockIdade && <BlockMessage message="A empresa precisa ter pelo menos 3 anos de existência para essa linha de crédito." />}
      </Field>

      <Field>
        <FieldLabel>Faturamento dos últimos 12 meses <span className="text-destructive">*</span></FieldLabel>
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
        {blockFaturamento && <BlockMessage message="O faturamento mínimo exigido para essa linha de crédito é de R$ 250 mil." />}
      </Field>

      <Field>
        <FieldLabel>Motivo do crédito <span className="text-destructive">*</span></FieldLabel>
        <Select value={motivo} onValueChange={setMotivo}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Selecione…" /></SelectTrigger>
          <SelectContent>
            {MOTIVOS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      {error && <FieldError>{error}</FieldError>}
      <Button className="w-full" onClick={handleSubmit} disabled={isPending || blockMei || blockIdade || blockFaturamento}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
    </FieldGroup>
  )
}

function CapitalGiroGarantiaStep({ proposalId, proposal }: ProductWizardProps) {
  const saved = getStepData<Record<string, string>>(proposal, 'garantia')
  const [possuiGarantia, setPossuiGarantia] = useState(saved.possuiGarantia ?? '')
  const [tipoGarantia, setTipoGarantia] = useState(saved.tipoGarantia ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit() {
    if (!possuiGarantia) return setError('Informe se possui garantia.')
    if (possuiGarantia === 'Sim' && !tipoGarantia) return setError('Selecione o tipo de garantia.')
    setError('')
    startTransition(async () => {
      const res = await saveStep({ proposalId: proposalId!, stepSlug: 'garantia', stepData: { possuiGarantia, tipoGarantia }, nextStep: 'retorno' })
      if ('error' in res) setError(res.error)
      else router.push(res.redirectTo)
    })
  }

  return (
    <FieldGroup>
      <p className="text-base font-semibold">Garantia na Operação</p>
      <p className="text-sm text-muted-foreground">Sua empresa possui alguma garantia real ou vinculada?</p>
      <div className="flex gap-3">
        {(['Sim', 'Não'] as const).map((v) => (
          <button key={v} type="button" onClick={() => setPossuiGarantia(v)}
            className={`flex-1 rounded-lg border py-3 text-sm font-semibold transition-colors ${possuiGarantia === v ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground'}`}>
            {v}
          </button>
        ))}
      </div>
      {possuiGarantia === 'Sim' && (
        <Field>
          <FieldLabel>Tipo de garantia <span className="text-destructive">*</span></FieldLabel>
          <Select value={tipoGarantia} onValueChange={setTipoGarantia}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Selecione…" /></SelectTrigger>
            <SelectContent>
              {TIPOS_GARANTIA.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      )}
      {error && <FieldError>{error}</FieldError>}
      <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
    </FieldGroup>
  )
}

export function CapitalGiroWizard({ currentStep, ...props }: ProductWizardProps) {
  switch (currentStep) {
    case 'operacao':
      return <CapitalGiroOperacaoStep {...props} currentStep={currentStep} />
    case 'dados-empresa':
      return <DadosEmpresaPJStep {...props} variant="full" nextStep="dados-socios" />
    case 'dados-socios':
      return <DadosSociosStep {...props} nextStep="garantia" withEstadoCivil />
    case 'garantia':
      return <CapitalGiroGarantiaStep {...props} currentStep={currentStep} />
    case 'retorno':
      return <RetornoStep {...props} message="Obrigado pelas informações! Agora é com a gente, sua proposta já está em análise. Fique de olho no WhatsApp e no seu e-mail." />
    default:
      return null
  }
}
