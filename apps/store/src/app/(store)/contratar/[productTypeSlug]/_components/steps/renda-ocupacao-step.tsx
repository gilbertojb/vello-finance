'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StoreButton as Button } from '@/components/ui/store-button'
import { StoreInput as Input } from '@/components/ui/store-input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { saveStep } from '@/app/(store)/contratar/actions'
import { parseBRL, formatBRLInput, getStepData } from './types'
import { StoreCurrencyInput } from '@/components/ui/store-currency-input'
import { ToggleGroup } from './toggle-group'
import type { WizardStepProps } from './types'

const OCUPACOES = ['CLT', 'Autônomo', 'Empresário', 'Aposentado', 'Servidor Público']
const TEMPOS = ['Menos de 1 ano', '1 a 3 anos', '3 a 5 anos', 'Mais de 5 anos']

type Props = WizardStepProps & { nextStep: string; withComposicaoRenda?: boolean }

export function RendaOcupacaoStep({ proposalId, proposal, nextStep, withComposicaoRenda }: Props) {
  const saved = getStepData<Record<string, string>>(proposal, 'renda-ocupacao')
  const dadosPessoais = getStepData<{ estadoCivil?: string }>(proposal, 'dados-pessoais')
  const isCasado = withComposicaoRenda && dadosPessoais.estadoCivil === 'casado'

  const [ocupacao, setOcupacao] = useState(saved.ocupacao ?? '')
  const [profissao, setProfissao] = useState(saved.profissao ?? '')
  const [rendaStr, setRendaStr] = useState(saved.renda ? formatBRLInput(Number(saved.renda)) : '')
  const [tempo, setTempo] = useState(saved.tempo ?? '')
  const [empresa, setEmpresa] = useState(saved.empresa ?? '')
  const [composicaoRenda, setComposicaoRenda] = useState(saved.composicaoRenda ?? '')
  const [rendaConjugeStr, setRendaConjugeStr] = useState(saved.rendaConjuge ? formatBRLInput(Number(saved.rendaConjuge)) : '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit() {
    if (!ocupacao || !rendaStr || !tempo) return setError('Preencha todos os campos obrigatórios.')
    if (isCasado && !composicaoRenda) return setError('Informe se haverá composição de renda.')
    if (isCasado && composicaoRenda === 'Sim' && !rendaConjugeStr) return setError('Informe a renda do cônjuge.')
    setError('')
    startTransition(async () => {
      const stepData: Record<string, unknown> = { ocupacao, profissao, renda: parseBRL(rendaStr), tempo, empresa }
      if (isCasado) {
        stepData.composicaoRenda = composicaoRenda
        if (composicaoRenda === 'Sim') stepData.rendaConjuge = parseBRL(rendaConjugeStr)
      }
      const res = await saveStep({ proposalId: proposalId!, stepSlug: 'renda-ocupacao', stepData, nextStep })
      if ('error' in res) setError(res.error)
      else router.push(res.redirectTo)
    })
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Tipo de ocupação <span className="text-destructive">*</span></FieldLabel>
        <Select value={ocupacao} onValueChange={setOcupacao}>
          <SelectTrigger className="w-full h-11 rounded-lg">
            <SelectValue placeholder="Selecione…" />
          </SelectTrigger>
          <SelectContent>
            {OCUPACOES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      {ocupacao === 'CLT' && (
        <Field>
          <FieldLabel>Profissão</FieldLabel>
          <Input placeholder="Sua profissão" value={profissao} onChange={(e) => setProfissao(e.target.value)} />
        </Field>
      )}

      <Field>
        <FieldLabel>Renda mensal <span className="text-destructive">*</span></FieldLabel>
        <StoreCurrencyInput value={rendaStr} onChange={setRendaStr} />
      </Field>

      <Field>
        <FieldLabel>Tempo na ocupação <span className="text-destructive">*</span></FieldLabel>
        <Select value={tempo} onValueChange={setTempo}>
          <SelectTrigger className="w-full h-11 rounded-lg">
            <SelectValue placeholder="Selecione…" />
          </SelectTrigger>
          <SelectContent>
            {TEMPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      {ocupacao === 'CLT' && (
        <Field>
          <FieldLabel>Empresa</FieldLabel>
          <Input placeholder="Nome da empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
        </Field>
      )}

      {isCasado && (
        <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div>
            <p className="mb-2 text-sm font-medium text-surface-foreground">
              Haverá composição de renda com o cônjuge? <span className="text-destructive">*</span>
            </p>
            <ToggleGroup options={['Sim', 'Não']} value={composicaoRenda} onChange={setComposicaoRenda} />
          </div>
          {composicaoRenda === 'Sim' && (
            <Field>
              <FieldLabel>Renda mensal do cônjuge <span className="text-destructive">*</span></FieldLabel>
              <StoreCurrencyInput value={rendaConjugeStr} onChange={setRendaConjugeStr} />
            </Field>
          )}
        </div>
      )}

      {error && <FieldError>{error}</FieldError>}
      <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
    </FieldGroup>
  )
}
