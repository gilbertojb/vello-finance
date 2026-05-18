'use client'

import { useState } from 'react'
import { StoreInput as Input } from '@/components/ui/store-input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'

export type AddressData = {
  cep: string
  rua: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
}

type Props = {
  label: string
  value: AddressData
  onChange: (data: AddressData) => void
  showSameAs?: { label: string; data: AddressData }
}

const EMPTY: AddressData = { cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' }

export function AddressForm({ label, value, onChange, showSameAs }: Props) {
  const [loading, setLoading] = useState(false)
  const [cepError, setCepError] = useState('')

  async function lookupCep(cep: string) {
    const digits = cep.replace(/\D/g, '')
    if (digits.length < 8) return
    setLoading(true)
    setCepError('')
    try {
      const res = await fetch(`/api/cep/${digits}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      onChange({ ...value, cep: digits, rua: data.logradouro ?? '', bairro: data.bairro ?? '', cidade: data.localidade ?? '', estado: data.uf ?? '' })
    } catch {
      setCepError('CEP não encontrado. Preencha o endereço manualmente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <FieldGroup>
      <p className="text-base font-semibold">{label}</p>

      {showSameAs && (
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            className="h-4 w-4 rounded accent-primary"
            onChange={(e) => { if (e.target.checked) onChange({ ...showSameAs.data }); else onChange(EMPTY) }}
          />
          <span className="text-sm text-muted-foreground">{showSameAs.label}</span>
        </label>
      )}

      <Field>
        <FieldLabel>CEP <span className="text-destructive">*</span></FieldLabel>
        <Input
          inputMode="numeric"
          placeholder="00000-000"
          value={value.cep}
          maxLength={9}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 8)
            onChange({ ...value, cep: v })
            if (v.length === 8) lookupCep(v)
          }}
        />
        {loading && <p className="text-xs text-muted-foreground">Buscando CEP…</p>}
        {cepError && <FieldError>{cepError}</FieldError>}
      </Field>

      <Field>
        <FieldLabel>Rua <span className="text-destructive">*</span></FieldLabel>
        <Input placeholder="Nome da rua" value={value.rua} onChange={(e) => onChange({ ...value, rua: e.target.value })} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel>Número <span className="text-destructive">*</span></FieldLabel>
          <Input placeholder="123" value={value.numero} onChange={(e) => onChange({ ...value, numero: e.target.value })} />
        </Field>
        <Field>
          <FieldLabel>Complemento</FieldLabel>
          <Input placeholder="Apto, bloco…" value={value.complemento} onChange={(e) => onChange({ ...value, complemento: e.target.value })} />
        </Field>
      </div>

      <Field>
        <FieldLabel>Bairro <span className="text-destructive">*</span></FieldLabel>
        <Input placeholder="Bairro" value={value.bairro} onChange={(e) => onChange({ ...value, bairro: e.target.value })} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel>Cidade <span className="text-destructive">*</span></FieldLabel>
          <Input placeholder="Cidade" value={value.cidade} onChange={(e) => onChange({ ...value, cidade: e.target.value })} />
        </Field>
        <Field>
          <FieldLabel>Estado <span className="text-destructive">*</span></FieldLabel>
          <Input placeholder="UF" maxLength={2} value={value.estado} onChange={(e) => onChange({ ...value, estado: e.target.value.toUpperCase() })} />
        </Field>
      </div>
    </FieldGroup>
  )
}
