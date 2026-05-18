'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StoreButton as Button } from '@/components/ui/store-button'
import { StoreInput as Input } from '@/components/ui/store-input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { saveStep } from '@/app/(store)/contratar/actions'
import { parseBRL, formatBRL, getStepData } from './types'
import type { WizardStepProps } from './types'

const OCUPACOES = ['CLT', 'Autônomo', 'Empresário', 'Aposentado', 'Servidor Público']
const TEMPOS = ['Menos de 1 ano', '1 a 3 anos', '3 a 5 anos', 'Mais de 5 anos']

type Props = WizardStepProps & { nextStep: string }

export function RendaOcupacaoStep({ proposalId, proposal, nextStep }: Props) {
  const saved = getStepData<Record<string, string>>(proposal, 'renda-ocupacao')
  const [ocupacao, setOcupacao] = useState(saved.ocupacao ?? '')
  const [profissao, setProfissao] = useState(saved.profissao ?? '')
  const [rendaStr, setRendaStr] = useState(saved.renda ? formatBRL(Number(saved.renda)) : '')
  const [tempo, setTempo] = useState(saved.tempo ?? '')
  const [empresa, setEmpresa] = useState(saved.empresa ?? '')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit() {
    if (!ocupacao || !rendaStr || !tempo) return setError('Preencha todos os campos obrigatórios.')
    setError('')
    startTransition(async () => {
      const res = await saveStep({
        proposalId: proposalId!,
        stepSlug: 'renda-ocupacao',
        stepData: { ocupacao, profissao, renda: parseBRL(rendaStr), tempo, empresa },
        nextStep,
      })
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
        <div className="flex items-center rounded-lg border border-input bg-transparent focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <span className="select-none pl-3 pr-2 text-sm text-muted-foreground">R$</span>
          <input
            type="text"
            inputMode="decimal"
            value={rendaStr}
            placeholder="0,00"
            className="flex-1 bg-transparent py-2 pr-3 text-sm outline-none placeholder:text-muted-foreground"
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '')
              setRendaStr(formatBRL(parseInt(digits || '0') / 100))
            }}
          />
        </div>
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

      {error && <FieldError>{error}</FieldError>}
      <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </Button>
    </FieldGroup>
  )
}
