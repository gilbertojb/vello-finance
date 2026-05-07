'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatRate } from '@/lib/utils/simulator'

const PURPOSE_OPTIONS = [
  { value: 'pessoal', label: 'Uso pessoal' },
  { value: 'empresa', label: 'Empresa / negócio' },
  { value: 'imovel', label: 'Imóvel' },
  { value: 'veiculo', label: 'Veículo' },
  { value: 'outro', label: 'Outro' },
]

type Props = {
  tenantProductId: string
  minRate: number
  initialAmount: number
  initialTerm: number
}

type FormErrors = Record<string, string>

export function StepOneForm({
  tenantProductId,
  minRate,
  initialAmount,
  initialTerm,
}: Props) {
  const router = useRouter()
  const [purpose, setPurpose] = useState('')
  const [amount, setAmount] = useState(String(initialAmount))
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [term, setTerm] = useState(String(initialTerm))
  const [errors, setErrors] = useState<FormErrors>({})

  function validate(): boolean {
    const errs: FormErrors = {}
    if (!purpose) errs.purpose = 'Selecione uma finalidade'
    if (!amount || Number(amount) <= 0) errs.amount = 'Informe um valor válido'
    if (!name || name.trim().length < 3) errs.name = 'Nome deve ter ao menos 3 caracteres'
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'E-mail inválido'
    if (!term) errs.term = 'Selecione um prazo'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleContinue() {
    if (!validate()) return
    const params = new URLSearchParams({
      step: '2',
      purpose,
      amount,
      term,
      name: name.trim(),
      email: email.trim(),
    })
    router.push(`/solicitar/${tenantProductId}?${params.toString()}`)
  }

  return (
    <div className="space-y-5">
      {/* Finalidade */}
      <div className="space-y-1.5">
        <Label htmlFor="purpose">Finalidade do crédito</Label>
        <Select value={purpose} onValueChange={setPurpose}>
          <SelectTrigger id="purpose">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {PURPOSE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.purpose && (
          <p className="text-xs text-destructive">{errors.purpose}</p>
        )}
      </div>

      {/* Valor */}
      <div className="space-y-1.5">
        <Label htmlFor="amount">Valor desejado (R$)</Label>
        <Input
          id="amount"
          type="number"
          min={0}
          step={100}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Ex: 50000"
        />
        {errors.amount && (
          <p className="text-xs text-destructive">{errors.amount}</p>
        )}
      </div>

      {/* Nome */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome completo</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome completo"
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      {/* E-mail */}
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      {/* Prazo */}
      <div className="space-y-1.5">
        <Label htmlFor="term">Prazo desejado (meses)</Label>
        <Input
          id="term"
          type="number"
          min={1}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Ex: 36"
        />
        {errors.term && (
          <p className="text-xs text-destructive">{errors.term}</p>
        )}
      </div>

      {/* Resumo */}
      <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Parcela estimada: <strong>R$ --,--</strong> &nbsp;·&nbsp; Taxa a partir de{' '}
        <strong>{formatRate(minRate)}% a.m.</strong>
      </div>

      <Button className="w-full" onClick={handleContinue}>
        Continuar →
      </Button>
    </div>
  )
}
