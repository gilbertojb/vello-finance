'use client'

import { useActionState, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { InputMask } from '@react-input/mask'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const maskInputClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

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
    <form action={formAction} className="space-y-5">
      {/* Hidden inputs — dados do passo 1 */}
      <input type="hidden" name="purpose" value={step1Data.purpose} />
      <input type="hidden" name="desired_amount" value={step1Data.amount} />
      <input type="hidden" name="desired_term_months" value={step1Data.term} />
      <input type="hidden" name="client_name" value={step1Data.name} />
      <input type="hidden" name="client_email" value={step1Data.email} />

      {/* CPF */}
      <div className="space-y-1.5">
        <Label htmlFor="cpf">CPF</Label>
        <InputMask
          mask="___.___.___-__"
          replacement={{ _: /\d/ }}
          id="cpf"
          name="client_cpf"
          placeholder="000.000.000-00"
          className={maskInputClass}
        />
        {state.errors?.client_cpf && (
          <p className="text-xs text-destructive">{state.errors.client_cpf[0]}</p>
        )}
      </div>

      {/* Telefone */}
      <div className="space-y-1.5">
        <Label htmlFor="phone">Telefone / WhatsApp</Label>
        <InputMask
          mask="(__) _____-____"
          replacement={{ _: /\d/ }}
          id="phone"
          name="client_phone"
          placeholder="(00) 00000-0000"
          className={maskInputClass}
        />
        {state.errors?.client_phone && (
          <p className="text-xs text-destructive">{state.errors.client_phone[0]}</p>
        )}
      </div>

      {/* Data de nascimento */}
      <div className="space-y-1.5">
        <Label htmlFor="birthdate">Data de nascimento</Label>
        <Input
          id="birthdate"
          type="date"
          name="client_birthdate"
          max={new Date(Date.now() - 18 * 365.25 * 86400000)
            .toISOString()
            .split('T')[0]}
        />
        {state.errors?.client_birthdate && (
          <p className="text-xs text-destructive">{state.errors.client_birthdate[0]}</p>
        )}
      </div>

      {/* CEP */}
      <div className="space-y-1.5">
        <Label htmlFor="cep">CEP</Label>
        <InputMask
          mask="_____-___"
          replacement={{ _: /\d/ }}
          id="cep"
          name="zip"
          placeholder="00000-000"
          value={cep}
          onChange={(e) => {
            setCep(e.target.value)
            lookupCep(e.target.value)
          }}
          className={maskInputClass}
        />
        {cepLoading && (
          <p className="text-xs text-muted-foreground">Buscando endereço...</p>
        )}
        {state.errors?.zip && (
          <p className="text-xs text-destructive">{state.errors.zip[0]}</p>
        )}
      </div>

      {/* Rua + Número */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="street">Rua</Label>
          <Input
            id="street"
            name="street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Nome da rua"
          />
          {state.errors?.street && (
            <p className="text-xs text-destructive">{state.errors.street[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="number">Número</Label>
          <Input id="number" name="number" placeholder="123" />
          {state.errors?.number && (
            <p className="text-xs text-destructive">{state.errors.number[0]}</p>
          )}
        </div>
      </div>

      {/* Complemento */}
      <div className="space-y-1.5">
        <Label htmlFor="complement">Complemento (opcional)</Label>
        <Input id="complement" name="complement" placeholder="Apto, bloco, etc." />
      </div>

      {/* Bairro */}
      <div className="space-y-1.5">
        <Label htmlFor="neighborhood">Bairro</Label>
        <Input
          id="neighborhood"
          name="neighborhood"
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
          placeholder="Bairro"
        />
        {state.errors?.neighborhood && (
          <p className="text-xs text-destructive">{state.errors.neighborhood[0]}</p>
        )}
      </div>

      {/* Cidade + UF */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            readOnly={!!city}
            placeholder="Cidade"
          />
          {state.errors?.city && (
            <p className="text-xs text-destructive">{state.errors.city[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="uf">UF</Label>
          <Input
            id="uf"
            name="state"
            value={uf}
            onChange={(e) => setUf(e.target.value)}
            readOnly={!!uf}
            maxLength={2}
            placeholder="SP"
          />
          {state.errors?.state && (
            <p className="text-xs text-destructive">{state.errors.state[0]}</p>
          )}
        </div>
      </div>

      {state.message && !state.success && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() =>
            router.push(
              `/solicitar/${tenantProductId}?step=1&amount=${step1Data.amount}&term=${step1Data.term}`,
            )
          }
        >
          ← Voltar
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? 'Enviando...' : 'Enviar solicitação'}
        </Button>
      </div>
    </form>
  )
}
