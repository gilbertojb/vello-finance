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
import { RetornoStep } from '../steps/retorno-step'
import { DadosPessoaisPFStep } from '../steps/dados-pessoais-pf-step'
import { EnderecoStep } from '../steps/endereco-step'
import { RendaOcupacaoStep } from '../steps/renda-ocupacao-step'
import type { ProductWizardProps } from '../steps/types'

const TIPOS_IMOVEL = ['Casa de rua', 'Casa de condomínio', 'Apartamento', 'Terreno', 'Escritório', 'Loja', 'Estúdio', 'Flat']
const MOTIVOS = ['Quitar dívidas pessoais', 'Quitar dívidas da empresa', 'Investir em negócio próprio', 'Reforma ou construção', 'Aquisição de outro imóvel', 'Projetos pessoais', 'Outros']

function HomeEquityOperacaoStep({ proposalId, productId, productTypeSlug, simulationId, proposal, currentStep }: ProductWizardProps) {
  const saved = getStepData<Record<string, string>>(proposal, 'operacao')
  const [tipoImovel, setTipoImovel] = useState(saved.tipoImovel ?? '')
  const [financiado, setFinanciado] = useState(saved.financiado ?? '')
  const [valorPagoStr, setValorPagoStr] = useState(saved.valorPago ? formatBRLInput(Number(saved.valorPago)) : '')
  const [matricula, setMatricula] = useState(saved.matricula ?? '')
  const [motivo, setMotivo] = useState(saved.motivo ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit() {
    if (!tipoImovel || !financiado || !matricula || !motivo) return setError('Preencha todos os campos.')
    setError('')
    startTransition(async () => {
      let clientName: string | undefined
      let clientPhone: string | undefined
      try {
        const sim = JSON.parse(sessionStorage.getItem('sim:home-equity') ?? '{}')
        clientName = sim.nome || undefined
        clientPhone = sim.whatsapp || undefined
      } catch { /* ignore */ }

      const stepData = { tipoImovel, financiado, valorPago: parseBRL(valorPagoStr), matricula, motivo }
      const res = proposalId
        ? await saveStep({ proposalId, stepSlug: 'operacao', stepData, nextStep: 'dados-pessoais' })
        : await createProposal({ productId: productId!, productTypeSlug, simulationId: simulationId ?? undefined, stepSlug: 'operacao', stepData, nextStep: 'dados-pessoais', clientName, clientPhone })
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
          <StoreCurrencyInput value={valorPagoStr} onChange={setValorPagoStr} />
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

export function HomeEquityWizard({ currentStep, ...props }: ProductWizardProps) {
  switch (currentStep) {
    case 'operacao':
      return <HomeEquityOperacaoStep {...props} currentStep={currentStep} />
    case 'dados-pessoais':
      return <DadosPessoaisPFStep {...props} nextStep="endereco-garantia" withEstadoCivil />
    case 'endereco-garantia':
      return <EnderecoStep {...props} stepSlug="endereco-garantia" nextStep="endereco-residencial" label="Endereço do Imóvel em Garantia" />
    case 'endereco-residencial':
      return <EnderecoStep {...props} stepSlug="endereco-residencial" nextStep="renda-ocupacao" label="Endereço Residencial" showSameAs={{ label: 'Mesmo endereço da garantia', sourceStepSlug: 'endereco-garantia' }} />
    case 'renda-ocupacao':
      return <RendaOcupacaoStep {...props} nextStep="retorno" withComposicaoRenda />
    case 'retorno':
      return <RetornoStep {...props} message="Obrigado pelas informações! Agora é com a gente, sua proposta já está em análise. Fique de olho no WhatsApp e no seu e-mail." />
    default:
      return null
  }
}
