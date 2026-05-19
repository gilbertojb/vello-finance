'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StoreButton as Button } from '@/components/ui/store-button'
import { StoreInput as Input } from '@/components/ui/store-input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { saveStep } from '@/app/(store)/contratar/actions'
import { parseBRL, formatBRL, getStepData } from './types'
import { StoreCurrencyInput } from '@/components/ui/store-currency-input'
import { BlockMessage } from './block-message'
import type { WizardStepProps } from './types'

type Props = WizardStepProps & {
  variant: 'simple' | 'full'
  nextStep: string
  stepSlug?: string
}

export function DadosEmpresaPJStep({ proposalId, proposal, variant, nextStep, stepSlug = 'dados-empresa' }: Props) {
  const saved = getStepData<Record<string, string>>(proposal, stepSlug)
  const [razaoSocial, setRazaoSocial] = useState(saved.razaoSocial ?? '')
  const [cnpj, setCnpj] = useState(saved.cnpj ?? '')
  const [tempoEmpresa, setTempoEmpresa] = useState(saved.tempoEmpresa ?? '')
  const [atividade, setAtividade] = useState(saved.atividade ?? '')
  const [produtos, setProdutos] = useState(saved.produtos ?? '')
  const [faturamentoStr, setFaturamentoStr] = useState(saved.faturamento ? formatBRL(Number(saved.faturamento)) : '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const blockTempo = variant === 'simple' && tempoEmpresa === 'Menos de 3 anos'

  function handleSubmit() {
    if (blockTempo) return
    if (!razaoSocial || !cnpj) return setError('Razão Social e CNPJ são obrigatórios.')
    setError('')
    const data: Record<string, unknown> = { razaoSocial, cnpj }
    if (variant === 'simple') data.tempoEmpresa = tempoEmpresa
    else { data.atividade = atividade; data.produtos = produtos; data.faturamento = parseBRL(faturamentoStr) }
    startTransition(async () => {
      const res = await saveStep({ proposalId: proposalId!, stepSlug, stepData: data, nextStep })
      if ('error' in res) setError(res.error)
      else router.push(res.redirectTo)
    })
  }

  return (
    <FieldGroup>
      <p className="text-sm text-muted-foreground">
        Não se preocupe — a cada etapa concluída, sua proposta fica salva automaticamente.
      </p>

      <Field>
        <FieldLabel>Razão Social <span className="text-destructive">*</span></FieldLabel>
        <Input placeholder="Razão Social da empresa" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} />
      </Field>

      <Field>
        <FieldLabel>CNPJ <span className="text-destructive">*</span></FieldLabel>
        <Input inputMode="numeric" placeholder="00.000.000/0001-00" value={cnpj}
          onChange={(e) => setCnpj(e.target.value.replace(/\D/g, '').slice(0, 14))} />
      </Field>

      {variant === 'simple' && (
        <Field>
          <FieldLabel>Tempo de empresa <span className="text-destructive">*</span></FieldLabel>
          <Select value={tempoEmpresa} onValueChange={setTempoEmpresa}>
            <SelectTrigger className="w-full h-11 rounded-lg">
              <SelectValue placeholder="Selecione…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Menos de 3 anos">Menos de 3 anos</SelectItem>
              <SelectItem value="Mais de 3 anos">Mais de 3 anos</SelectItem>
            </SelectContent>
          </Select>
          {blockTempo && <BlockMessage message="É necessário ter no mínimo 3 anos de empresa para esta linha de crédito." />}
        </Field>
      )}

      {variant === 'full' && (
        <>
          <Field>
            <FieldLabel>Atividade da empresa <span className="text-destructive">*</span></FieldLabel>
            <Input placeholder="Descreva a atividade" value={atividade} onChange={(e) => setAtividade(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Produtos ou serviços oferecidos</FieldLabel>
            <Input placeholder="Descreva seus produtos/serviços" value={produtos} onChange={(e) => setProdutos(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Faturamento anual <span className="text-destructive">*</span></FieldLabel>
            <StoreCurrencyInput value={faturamentoStr} onChange={setFaturamentoStr} />
          </Field>
        </>
      )}

      {error && <FieldError>{error}</FieldError>}
      <Button className="w-full" onClick={handleSubmit} disabled={isPending || blockTempo}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
    </FieldGroup>
  )
}
