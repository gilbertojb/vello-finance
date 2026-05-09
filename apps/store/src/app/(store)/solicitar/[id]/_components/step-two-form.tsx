'use client'

import { useActionState, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { InputMask } from '@react-input/mask'
import type { ActionResult } from '../actions'

type CepData = {
  street: string
  neighborhood: string
  city: string
  state: string
}

type Step1Data = {
  purpose: string
  amount: string
  term: string
  name: string
  email: string
}

const initialState: ActionResult = { success: false, message: null, errors: null }

const fieldCls = 'w-full border-b border-b-black/18 bg-transparent pb-2.5 pt-2 text-base text-surface-foreground outline-none transition-colors placeholder:text-surface-foreground/30 focus:border-b-[oklch(0.25_0.04_45)]'
const labelCls = 'text-xs font-semibold tracking-[.02em] text-surface-foreground'

type Props = {
  tenantProductId: string
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
  step1Data: Step1Data
}

export function StepTwoForm({ tenantProductId, action, step1Data }: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(action, initialState)
  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [uf, setUf] = useState('')
  const [cepLoading, setCepLoading] = useState(false)

  const lookupCep = useCallback(async (rawCep: string) => {
    const digits = rawCep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`/api/cep/${digits}`)
      if (!res.ok) return
      const data = (await res.json()) as CepData
      setStreet(data.street)
      setNeighborhood(data.neighborhood)
      setCity(data.city)
      setUf(data.state)
    } finally {
      setCepLoading(false)
    }
  }, [])

  return (
    <form action={formAction}>
      {/* Hidden inputs — dados do passo 1 */}
      <input type="hidden" name="purpose" value={step1Data.purpose} />
      <input type="hidden" name="desired_amount" value={step1Data.amount} />
      <input type="hidden" name="desired_term_months" value={step1Data.term} />
      <input type="hidden" name="client_name" value={step1Data.name} />
      <input type="hidden" name="client_email" value={step1Data.email} />

      <div className="mb-9">
        <h3 className="mb-1 text-lg font-semibold tracking-tight text-surface-foreground">Dados pessoais</h3>
        <p className="text-sm text-surface-foreground/55">Precisamos de algumas informações para continuar.</p>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-7 max-sm:grid-cols-1">
        {/* CPF */}
        <div className="flex flex-col gap-2.5">
          <span className={labelCls}>CPF</span>
          <InputMask
            mask="___.___.___-__"
            replacement={{ _: /\d/ }}
            name="client_cpf"
            placeholder="000.000.000-00"
            className={fieldCls}
          />
          {state.errors?.client_cpf && <p className="text-xs text-destructive">{state.errors.client_cpf[0]}</p>}
        </div>

        {/* Telefone */}
        <div className="flex flex-col gap-2.5">
          <span className={labelCls}>Telefone / WhatsApp</span>
          <InputMask
            mask="(__) _____-____"
            replacement={{ _: /\d/ }}
            name="client_phone"
            placeholder="(00) 00000-0000"
            className={fieldCls}
          />
          {state.errors?.client_phone && <p className="text-xs text-destructive">{state.errors.client_phone[0]}</p>}
        </div>

        {/* Data de nascimento */}
        <div className="col-span-2 flex flex-col gap-2.5 max-sm:col-span-1">
          <span className={labelCls}>Data de nascimento</span>
          <input
            type="date"
            name="client_birthdate"
            max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split('T')[0]}
            className={fieldCls}
          />
          {state.errors?.client_birthdate && <p className="text-xs text-destructive">{state.errors.client_birthdate[0]}</p>}
        </div>
      </div>

      {/* Endereço */}
      <div className="mt-9 border-t border-black/[0.08] pt-9">
        <h4 className="mb-7 text-sm font-semibold tracking-tight text-surface-foreground">Endereço</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-7 max-sm:grid-cols-1">
          {/* CEP */}
          <div className="flex flex-col gap-2.5">
            <span className={labelCls}>CEP</span>
            <InputMask
              mask="_____-___"
              replacement={{ _: /\d/ }}
              name="zip"
              placeholder="00000-000"
              value={cep}
              onChange={(e) => {
                setCep(e.target.value)
                lookupCep(e.target.value)
              }}
              className={fieldCls}
            />
            {cepLoading && <p className="text-xs text-surface-foreground/50">Buscando endereço...</p>}
            {state.errors?.zip && <p className="text-xs text-destructive">{state.errors.zip[0]}</p>}
          </div>

          {/* Número */}
          <div className="flex flex-col gap-2.5">
            <span className={labelCls}>Número</span>
            <input type="text" name="number" placeholder="123" className={fieldCls} />
            {state.errors?.number && <p className="text-xs text-destructive">{state.errors.number[0]}</p>}
          </div>

          {/* Rua */}
          <div className="col-span-2 flex flex-col gap-2.5 max-sm:col-span-1">
            <span className={labelCls}>Rua</span>
            <input
              type="text"
              name="street"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Nome da rua"
              className={fieldCls}
            />
            {state.errors?.street && <p className="text-xs text-destructive">{state.errors.street[0]}</p>}
          </div>

          {/* Complemento */}
          <div className="col-span-2 flex flex-col gap-2.5 max-sm:col-span-1">
            <span className={labelCls}>Complemento (opcional)</span>
            <input type="text" name="complement" placeholder="Apto, bloco, etc." className={fieldCls} />
          </div>

          {/* Bairro */}
          <div className="flex flex-col gap-2.5">
            <span className={labelCls}>Bairro</span>
            <input
              type="text"
              name="neighborhood"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Bairro"
              className={fieldCls}
            />
            {state.errors?.neighborhood && <p className="text-xs text-destructive">{state.errors.neighborhood[0]}</p>}
          </div>

          {/* Cidade */}
          <div className="flex flex-col gap-2.5">
            <span className={labelCls}>Cidade</span>
            <input
              type="text"
              name="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              readOnly={!!city}
              placeholder="Cidade"
              className={fieldCls}
            />
            {state.errors?.city && <p className="text-xs text-destructive">{state.errors.city[0]}</p>}
          </div>

          {/* UF */}
          <div className="flex flex-col gap-2.5">
            <span className={labelCls}>UF</span>
            <input
              type="text"
              name="state"
              value={uf}
              onChange={(e) => setUf(e.target.value)}
              readOnly={!!uf}
              maxLength={2}
              placeholder="SP"
              className={fieldCls}
            />
            {state.errors?.state && <p className="text-xs text-destructive">{state.errors.state[0]}</p>}
          </div>
        </div>
      </div>

      {state.message && !state.success && (
        <p className="mt-6 text-sm text-destructive">{state.message}</p>
      )}

      <div className="mt-10 flex items-center justify-between border-t border-black/[0.08] pt-8">
        <button
          type="button"
          onClick={() => router.push(`/solicitar/${tenantProductId}?step=1&amount=${step1Data.amount}&term=${step1Data.term}`)}
          className="rounded-full border border-surface-foreground/18 px-[26px] py-3.5 text-sm font-medium text-surface-foreground transition-all hover:border-surface-foreground"
        >
          Voltar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-surface-foreground px-[26px] py-3.5 text-sm font-semibold text-surface transition-all hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? 'Enviando...' : 'Enviar solicitação →'}
        </button>
      </div>
    </form>
  )
}
