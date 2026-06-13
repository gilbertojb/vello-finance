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
import { DadosEmpresaPJStep } from '../steps/dados-empresa-pj-step'
import { AtividadeFaturamentoStep } from '../steps/atividade-faturamento-step'
import { DadosSociosStep } from '../steps/dados-socios-step'
import { RendaOcupacaoStep } from '../steps/renda-ocupacao-step'
import type { ProductWizardProps } from '../steps/types'

const TIPOS_VEICULO = ['Carro', 'Moto', 'Caminhão', 'Van']
const CURRENT_YEAR = new Date().getFullYear()

function FinanciamentoVeiculoOperacaoStep({ proposalId, productId, productTypeSlug, simulationId, proposal, currentStep }: ProductWizardProps) {
  const saved = getStepData<Record<string, string>>(proposal, 'operacao')
  const [tipoComprador, setTipoComprador] = useState(saved.tipoComprador ?? '')
  const [tipoVeiculo, setTipoVeiculo] = useState(saved.tipoVeiculo ?? '')
  const [financiado, setFinanciado] = useState(saved.financiado ?? '')
  const [placa, setPlaca] = useState(saved.placa ?? '')
  const [modelo, setModelo] = useState(saved.modelo ?? '')
  const [anoFabricacao, setAnoFabricacao] = useState(saved.anoFabricacao ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const blockFinanciado = financiado === 'Sim'
  const router = useRouter()

  const anoNum = anoFabricacao ? parseInt(anoFabricacao, 10) : 0
  const blockAnoFabricacao = anoNum > 0 && (anoNum < CURRENT_YEAR - 15 || anoNum > CURRENT_YEAR)

  function handleSubmit() {
    if (blockFinanciado || blockAnoFabricacao) return
    if (!tipoComprador || !tipoVeiculo || !financiado || !modelo || !anoFabricacao) return setError('Preencha todos os campos obrigatórios.')
    setError('')
    const nextStep = tipoComprador === 'Pessoa Física' ? 'dados-pessoais' : 'dados-solicitante'
    startTransition(async () => {
      let clientName: string | undefined
      let clientPhone: string | undefined
      if (tipoComprador === 'Pessoa Física') {
        try {
          const sim = JSON.parse(sessionStorage.getItem('sim:financiamento-veiculo') ?? '{}')
          clientName = sim.nome || undefined
          clientPhone = sim.whatsapp || undefined
        } catch { /* ignore */ }
      }

      const stepData = { tipoComprador, tipoVeiculo, financiado, modelo, anoFabricacao, placa: placa.toUpperCase() }
      const res = proposalId
        ? await saveStep({ proposalId, stepSlug: 'operacao', stepData, nextStep })
        : await createProposal({ productId: productId!, productTypeSlug, simulationId: simulationId ?? undefined, stepSlug: 'operacao', stepData, nextStep, clientName, clientPhone })
      if ('error' in res) setError(res.error)
      else router.push(res.redirectTo)
    })
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Tipo de comprador <span className="text-destructive">*</span></FieldLabel>
        <Select value={tipoComprador} onValueChange={setTipoComprador}>
          <SelectTrigger className="w-full h-11 rounded-lg"><SelectValue placeholder="Selecione…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Pessoa Física">Pessoa Física</SelectItem>
            <SelectItem value="Pessoa Jurídica">Pessoa Jurídica</SelectItem>
          </SelectContent>
        </Select>
      </Field>

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
        <FieldLabel>Marca e modelo <span className="text-destructive">*</span></FieldLabel>
        <Input
          type="text"
          placeholder="Ex: Honda Civic 2.0"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel>Ano de fabricação <span className="text-destructive">*</span></FieldLabel>
        <Input
          type="text"
          inputMode="numeric"
          placeholder={String(CURRENT_YEAR)}
          maxLength={4}
          value={anoFabricacao}
          onChange={(e) => setAnoFabricacao(e.target.value.replace(/\D/g, '').slice(0, 4))}
        />
        {blockAnoFabricacao && <BlockMessage message="Veículos com mais de 15 anos de fabricação não são elegíveis para financiamento." />}
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
        <FieldLabel>Placa do veículo</FieldLabel>
        <Input
          type="text"
          placeholder="ABC-1234 (opcional)"
          value={placa}
          maxLength={8}
          onChange={(e) => setPlaca(e.target.value.toUpperCase())}
        />
      </Field>

      {error && <FieldError>{error}</FieldError>}
      <Button className="w-full" onClick={handleSubmit} disabled={isPending || blockFinanciado || blockAnoFabricacao}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
    </FieldGroup>
  )
}

export function FinanciamentoVeiculoWizard({ currentStep, ...props }: ProductWizardProps) {
  switch (currentStep) {
    case 'operacao':
      return <FinanciamentoVeiculoOperacaoStep {...props} currentStep={currentStep} />
    // PF path
    case 'dados-pessoais':
      return <DadosPessoaisPFStep {...props} nextStep="renda-ocupacao" withNomeMae />
    case 'renda-ocupacao':
      return <RendaOcupacaoStep {...props} nextStep="retorno" />
    // PJ path
    case 'dados-solicitante':
      return <DadosEmpresaPJStep {...props} variant="simple" nextStep="atividade-faturamento" stepSlug="dados-solicitante" />
    case 'atividade-faturamento':
      return <AtividadeFaturamentoStep {...props} nextStep="dados-socios" hasProdutos />
    case 'dados-socios':
      return <DadosSociosStep {...props} nextStep="retorno" withEstadoCivil />
    // Common
    case 'retorno':
      return <RetornoStep {...props} message="Obrigado pelas informações! Em breve teremos o retorno da sua proposta, fique atento ao WhatsApp e e-mail." />
    default:
      return null
  }
}
