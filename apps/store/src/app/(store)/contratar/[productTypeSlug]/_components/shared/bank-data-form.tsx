'use client'

import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const BANKS = [
  'Banco do Brasil', 'Bradesco', 'Caixa Econômica Federal', 'Itaú',
  'Santander', 'Nubank', 'Sicredi', 'Sicoob', 'Inter', 'C6 Bank',
  'BTG Pactual', 'XP', 'Banrisul', 'BRB', 'Mercado Pago', 'PicPay',
]

export type BankData = {
  banco: string
  agencia: string
  conta: string
  pix: string
  confirmaTitularidade: boolean
}

type Props = {
  value: BankData
  onChange: (data: BankData) => void
  titularLabel?: string
  error?: string
}

export function BankDataForm({ value, onChange, titularLabel = 'titular do crédito', error }: Props) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Banco <span className="text-destructive">*</span></FieldLabel>
        <Select value={value.banco} onValueChange={(v) => onChange({ ...value, banco: v })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione seu banco…" />
          </SelectTrigger>
          <SelectContent>
            {BANKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel>Agência <span className="text-destructive">*</span></FieldLabel>
          <Input
            inputMode="numeric"
            placeholder="0000"
            value={value.agencia}
            onChange={(e) => onChange({ ...value, agencia: e.target.value.replace(/\D/g, '') })}
          />
        </Field>
        <Field>
          <FieldLabel>Conta-corrente <span className="text-destructive">*</span></FieldLabel>
          <Input
            inputMode="numeric"
            placeholder="00000-0"
            value={value.conta}
            onChange={(e) => onChange({ ...value, conta: e.target.value.replace(/\D/g, '') })}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel>Chave PIX <span className="text-muted-foreground font-normal text-xs">(opcional)</span></FieldLabel>
        <Input
          placeholder="CPF, e-mail, telefone ou chave aleatória"
          value={value.pix}
          onChange={(e) => onChange({ ...value, pix: e.target.value })}
        />
      </Field>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/40 p-4">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 flex-shrink-0 rounded accent-primary"
          checked={value.confirmaTitularidade}
          onChange={(e) => onChange({ ...value, confirmaTitularidade: e.target.checked })}
        />
        <span className="text-sm text-muted-foreground">
          Confirmo que esta conta bancária está no nome do {titularLabel}.
        </span>
      </label>

      {error && <FieldError>{error}</FieldError>}
    </FieldGroup>
  )
}
