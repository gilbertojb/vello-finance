'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatRate } from '@/lib/utils/simulator'

const PURPOSE_OPTIONS = [
  { value: 'pessoal', label: 'Uso pessoal' },
  { value: 'empresa', label: 'Empresa / negócio' },
  { value: 'imovel', label: 'Imóvel' },
  { value: 'veiculo', label: 'Veículo' },
  { value: 'outro', label: 'Outro' },
]

type Props = { tenantProductId: string; minRate: number; initialAmount: number; initialTerm: number }
type FormErrors = Record<string, string>

const fieldCls = 'w-full border-b border-b-black/18 bg-transparent pb-2.5 pt-2 text-base text-surface-foreground outline-none transition-colors placeholder:text-surface-foreground/30 focus:border-b-[oklch(0.25_0.04_45)]'
const labelCls = 'text-xs font-semibold tracking-[.02em] text-surface-foreground'

export function StepOneForm({ tenantProductId, minRate, initialAmount, initialTerm }: Props) {
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
    if (!term) errs.term = 'Informe o prazo'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleContinue() {
    if (!validate()) return
    const params = new URLSearchParams({ step: '2', purpose, amount, term, name: name.trim(), email: email.trim() })
    router.push(`/solicitar/${tenantProductId}?${params.toString()}`)
  }

  return (
    <div>
      <div className="mb-9">
        <h3 className="mb-1 text-lg font-semibold tracking-tight text-surface-foreground">Dados da simulação</h3>
        <p className="text-sm text-surface-foreground/55">Informe os detalhes do crédito que você precisa.</p>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-7 max-sm:grid-cols-1">
        <div className="col-span-2 flex flex-col gap-2.5 max-sm:col-span-1">
          <span className={labelCls}>Finalidade do crédito</span>
          <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className={`${fieldCls} cursor-pointer`}>
            <option value="" disabled>Selecione...</option>
            {PURPOSE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {errors.purpose && <p className="text-xs text-destructive">{errors.purpose}</p>}
        </div>

        <div className="flex flex-col gap-2.5">
          <span className={labelCls}>Valor desejado</span>
          <div className="flex items-center border-b border-b-black/18 pb-2.5 pt-2 transition-colors focus-within:border-b-[oklch(0.25_0.04_45)]">
            <span className="mr-1.5 text-base text-surface-foreground/45">R$</span>
            <input type="number" min={0} step={100} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50.000" className="flex-1 bg-transparent text-base text-surface-foreground outline-none placeholder:text-surface-foreground/30" />
          </div>
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
        </div>

        <div className="flex flex-col gap-2.5">
          <span className={labelCls}>Prazo (meses)</span>
          <input type="number" min={1} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="36" className={fieldCls} />
          {errors.term && <p className="text-xs text-destructive">{errors.term}</p>}
        </div>

        <div className="flex flex-col gap-2.5">
          <span className={labelCls}>Nome completo</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" className={fieldCls} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="flex flex-col gap-2.5">
          <span className={labelCls}>E-mail</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className={fieldCls} />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
      </div>

      <div className="mt-10 border-l-2 border-primary/50 pl-4 text-sm text-surface-foreground/55">
        Taxa a partir de <strong className="text-surface-foreground">{formatRate(minRate)}% a.m.</strong>
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-black/[0.08] pt-8">
        <button type="button" onClick={() => router.back()} className="rounded-full border border-surface-foreground/18 px-[26px] py-3.5 text-sm font-medium text-surface-foreground transition-all hover:border-surface-foreground">
          Voltar
        </button>
        <button type="button" onClick={handleContinue} className="rounded-full bg-surface-foreground px-[26px] py-3.5 text-sm font-semibold text-surface transition-all hover:opacity-90">
          Continuar →
        </button>
      </div>
    </div>
  )
}
