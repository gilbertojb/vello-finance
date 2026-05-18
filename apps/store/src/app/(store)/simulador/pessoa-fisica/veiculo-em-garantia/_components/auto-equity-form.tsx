'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/simulator'

function parseBRL(raw: string): number {
  return Math.max(0, Number(raw.replace(/\D/g, '')) || 0)
}

type Props = {
  productId: string
  isPj?: boolean
  minTermMonths: number
  maxTermMonths: number
  minAmount?: number
  maxAmount?: number
}

export function AutoEquityForm({
  productId,
  isPj = false,
  minTermMonths: _minTermMonths,
  maxTermMonths: _maxTermMonths,
  minAmount,
  maxAmount: _maxAmount,
}: Props) {
  const MIN_FIPE = minAmount ?? 10000
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [rawFipe, setRawFipe] = useState('')
  const [rawCredito, setRawCredito] = useState('')
  const [parcelas, setParcelas] = useState<number | null>(null)
  const [showWarning, setShowWarning] = useState(false)

  const valorFipe = parseBRL(rawFipe)
  const valorCreditoTyped = parseBRL(rawCredito)

  // Regra do Auto Equity: limite de 90% da FIPE
  const limite = valorFipe * 0.9
  const validCredito = valorCreditoTyped > limite ? limite : valorCreditoTyped

  if (valorCreditoTyped > limite && !showWarning && valorFipe > 0) {
    setShowWarning(true)
  } else if (valorCreditoTyped <= limite && showWarning) {
    setShowWarning(false)
  }

  const canSubmit =
    nome.trim().split(/\s+/).filter(Boolean).length >= 2 &&
    whatsapp.replace(/\D/g, '').length >= 10 &&
    valorFipe >= MIN_FIPE &&
    validCredito >= 5000 &&
    parcelas !== null

  const handleSubmit = () => {
    if (!canSubmit || parcelas === null) return
    const payload = {
      nome: nome.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      valorFipe,
      valorCredito: validCredito,
      parcelas,
    }
    const key = isPj ? 'sim:auto-equity-pj' : 'sim:auto-equity'
    sessionStorage.setItem(key, JSON.stringify(payload))

    const route = isPj
      ? '/simulador/pessoa-juridica/veiculo-em-garantia/resultado'
      : '/simulador/pessoa-fisica/veiculo-em-garantia/resultado'
    router.push(`${route}?productId=${productId}`)
  }

  return (
    <div className="space-y-5">
      {/* Chip Pessoa */}
      <div className="mb-6 flex justify-center">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-primary-foreground">
          {isPj ? 'Pessoa Jurídica' : 'Pessoa Física'}
        </span>
      </div>

      {/* Nome */}
      <div>
        <label htmlFor="nome" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Seu nome completo <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Como consta no seu documento"
          className="w-full rounded-2xl border border-surface-foreground/15 bg-white px-5 py-4 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* WhatsApp */}
      <div>
        <label htmlFor="whatsapp" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          WhatsApp para contato <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-3 text-sm font-medium text-surface-foreground/40">+55</span>
          <div className="h-5 w-px bg-surface-foreground/12" />
          <input
            type="tel"
            id="whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="(11) 99999-9999"
            className="flex-1 bg-transparent py-4 pl-3 pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
      </div>

      {/* Valor da FIPE */}
      <div>
        <label htmlFor="valorFipe" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Valor aproximado da Tabela FIPE <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/50">R$</span>
          <input
            type="text"
            id="valorFipe"
            inputMode="numeric"
            value={rawFipe}
            onChange={(e) => setRawFipe(e.target.value.replace(/\D/g, ''))}
            onBlur={() => valorFipe > 0 && setRawFipe(new Intl.NumberFormat('pt-BR').format(valorFipe))}
            placeholder="0"
            className="flex-1 bg-transparent py-4 pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
        <p className="mt-1.5 text-xs text-surface-foreground/50">Valor mínimo: {formatCurrency(MIN_FIPE)}</p>
      </div>

      {/* Valor do crédito */}
      <div>
        <label htmlFor="valorCredito" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Quanto você precisa de crédito? <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/50">R$</span>
          <input
            type="text"
            id="valorCredito"
            inputMode="numeric"
            value={rawCredito}
            onChange={(e) => setRawCredito(e.target.value.replace(/\D/g, ''))}
            onBlur={() =>
              valorCreditoTyped > 0 && setRawCredito(new Intl.NumberFormat('pt-BR').format(valorCreditoTyped))
            }
            placeholder="0"
            className="flex-1 bg-transparent py-4 pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
        <p className="mt-1.5 text-xs text-surface-foreground/50">Liberamos até 90% do valor da FIPE</p>
        {showWarning && (
          <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
            <p className="text-xs font-medium text-destructive/90">
              Valor ajustado ao limite de 90% ({formatCurrency(limite)})
            </p>
          </div>
        )}
      </div>

      {/* Parcelas */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Quantidade de parcelas <span className="text-destructive">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {[15, 25, 35, 45, 60, 90].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setParcelas(p)}
              className={`flex-1 rounded-2xl border py-3 text-sm font-medium transition-colors ${
                parcelas === p
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-surface-foreground/12 bg-surface-foreground/5 text-surface-foreground/60 hover:bg-surface-foreground/10'
              }`}
            >
              {p}x
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="mt-2 w-full rounded-2xl bg-surface-foreground px-5 py-4 text-sm font-semibold text-surface transition-opacity disabled:opacity-40"
      >
        Ver minha simulação →
      </button>
    </div>
  )
}
