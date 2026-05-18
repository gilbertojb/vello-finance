'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StoreButton as Button } from '@/components/ui/store-button'
import { StoreInput as Input } from '@/components/ui/store-input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createProposal, saveStep } from '@/app/(store)/contratar/actions'
import { parseBRL, formatBRL, getStepData } from '../steps/types'
import { RetornoStep } from '../steps/retorno-step'
import { DadosEmpresaPJStep } from '../steps/dados-empresa-pj-step'
import { AtividadeFaturamentoStep } from '../steps/atividade-faturamento-step'
import { DadosSociosStep } from '../steps/dados-socios-step'
import { EnderecoStep } from '../steps/endereco-step'
import type { ProductWizardProps } from '../steps/types'

const TIPOS_IMOVEL = ['Casa de rua', 'Casa de condomínio', 'Apartamento', 'Terreno', 'Escritório', 'Loja', 'Estúdio', 'Flat']
const MOTIVOS = ['Quitar dívidas pessoais', 'Quitar dívidas da empresa', 'Investir em negócio próprio', 'Reforma ou construção', 'Aquisição de outro imóvel', 'Projetos pessoais', 'Outros']

function HomeEquityPJOperacaoStep({ proposalId, productId, productTypeSlug, simulationId, proposal, currentStep }: ProductWizardProps) {
  const saved = getStepData<Record<string, string>>(proposal, 'operacao')
  const [tipoImovel, setTipoImovel] = useState(saved.tipoImovel ?? '')
  const [financiado, setFinanciado] = useState(saved.financiado ?? '')
  const [valorPagoStr, setValorPagoStr] = useState(saved.valorPago ? formatBRL(Number(saved.valorPago)) : '')
  const [matricula, setMatricula] = useState(saved.matricula ?? '')
  const [motivo, setMotivo] = useState(saved.motivo ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit() {
    if (!tipoImovel || !financiado || !matricula || !motivo) return setError('Preencha todos os campos.')
    setError('')
    startTransition(async () => {
      const stepData = { tipoImovel, financiado, valorPago: parseBRL(valorPagoStr), matricula, motivo }
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
        <FieldLabel>Tipo de imóvel <span className="text-destructive">*</span></FieldLabel>
        <Select value={tipoImovel} onValueChange={setTipoImovel}>
          <SelectTrigger className="w-full h-11 rounded-lg"><SelectValue placeholder="Selecione…" /></SelectTrigger>
          <SelectContent>
            {TIPOS_IMOVEL.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel>O imóvel está financiado? <span className="text-destructive">*</span></FieldLabel>
        <Select value={financiado} onValueChange={setFinanciado}>
          <SelectTrigger className="w-full h-11 rounded-lg"><SelectValue placeholder="Selecione…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Não">Não</SelectItem>
            <SelectItem value="Sim">Sim</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {financiado === 'Sim' && (
        <Field>
          <FieldLabel>Valor pago até agora <span className="text-destructive">*</span></FieldLabel>
          <div className="flex items-center rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            <span className="select-none pl-3 pr-2 text-sm text-muted-foreground">R$</span>
            <input
              type="text"
              inputMode="decimal"
              value={valorPagoStr}
              placeholder="0,00"
              className="flex-1 bg-transparent py-2 pr-3 text-sm outline-none placeholder:text-muted-foreground"
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '')
                setValorPagoStr(formatBRL(parseInt(digits || '0') / 100))
              }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Financiamento superior a 40% do valor do imóvel impede a operação.</p>
        </Field>
      )}

      <Field>
        <FieldLabel>Número de matrícula <span className="text-destructive">*</span></FieldLabel>
        <Input
          type="text"
          inputMode="numeric"
          placeholder="Apenas números"
          value={matricula}
          onChange={(e) => setMatricula(e.target.value.replace(/\D/g, ''))}
        />
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
      <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
    </FieldGroup>
  )
}

export function HomeEquityPJWizard({ currentStep, ...props }: ProductWizardProps) {
  switch (currentStep) {
    case 'operacao':
      return <HomeEquityPJOperacaoStep {...props} currentStep={currentStep} />
    case 'dados-empresa':
      return <DadosEmpresaPJStep {...props} variant="simple" nextStep="atividade-faturamento" />
    case 'atividade-faturamento':
      return <AtividadeFaturamentoStep {...props} nextStep="dados-socios" />
    case 'dados-socios':
      return <DadosSociosStep {...props} nextStep="endereco-garantia" withEstadoCivil />
    case 'endereco-garantia':
      return <EnderecoStep {...props} stepSlug="endereco-garantia" nextStep="endereco-empresa" label="Endereço do Imóvel em Garantia" />
    case 'endereco-empresa':
      return <EnderecoStep {...props} stepSlug="endereco-empresa" nextStep="retorno" label="Endereço da Empresa" showSameAs={{ label: 'Mesmo endereço da garantia', sourceStepSlug: 'endereco-garantia' }} />
    case 'retorno':
      return <RetornoStep {...props} message="Obrigado pelas informações! Em breve teremos o retorno da sua proposta." />
    default:
      return null
  }
}
