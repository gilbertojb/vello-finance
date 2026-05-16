'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/simulator'

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
  const [marca, setMarca] = useState('')
  const [ano, setAno] = useState('')
  const [rawFipe, setRawFipe] = useState('')
  const [rawCredito, setRawCredito] = useState('')
  const [showWarning, setShowWarning] = useState(false)

  const valorFipe = Number(rawFipe.replace(/\D/g, '')) / 100
  const valorCreditoTyped = Number(rawCredito.replace(/\D/g, '')) / 100

  // Regra do Auto Equity: limite de 70% da FIPE
  const limite = valorFipe * 0.7
  const validCredito = valorCreditoTyped > limite ? limite : valorCreditoTyped

  if (valorCreditoTyped > limite && !showWarning && valorFipe > 0) {
    setShowWarning(true)
  } else if (valorCreditoTyped <= limite && showWarning) {
    setShowWarning(false)
  }

  const canSubmit =
    nome.trim().length > 3 &&
    whatsapp.replace(/\D/g, '').length >= 10 &&
    marca.trim().length > 1 &&
    ano.length === 4 &&
    valorFipe >= MIN_FIPE &&
    validCredito >= 5000

  const handleSubmit = () => {
    const payload = {
      nome: nome.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      marca: marca.trim(),
      ano: parseInt(ano, 10),
      valorFipe,
      valorCredito: validCredito,
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
        <span className="inline-flex items-center rounded-full bg-[oklch(0.96_0.03_85)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[oklch(0.48_0.07_50)]">
          {isPj ? 'Pessoa Jurídica' : 'Pessoa Física'}
        </span>
      </div>

      {/* Nome */}
      <div>
        <label htmlFor="nome" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Seu nome completo <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Como consta no seu documento"
          className="w-full rounded-2xl border border-surface-foreground/15 bg-white px-5 py-4 text-[15px] text-surface-foreground placeholder:text-surface-foreground/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* WhatsApp */}
      <div>
        <label htmlFor="whatsapp" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          WhatsApp para contato <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-3 text-[15px] font-medium text-surface-foreground/40">+55</span>
          <div className="h-5 w-px bg-surface-foreground/12" />
          <input
            type="tel"
            id="whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="(11) 99999-9999"
            className="flex-1 bg-transparent py-4 pl-3 pr-5 text-[15px] text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Marca */}
        <div>
          <label htmlFor="marca" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
            Marca do veículo <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="marca"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            placeholder="Ex: Fiat, VW..."
            className="w-full rounded-2xl border border-surface-foreground/15 bg-white px-5 py-4 text-[15px] text-surface-foreground placeholder:text-surface-foreground/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Ano */}
        <div>
          <label htmlFor="ano" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
            Ano do veículo <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="ano"
            inputMode="numeric"
            maxLength={4}
            value={ano}
            onChange={(e) => setAno(e.target.value.replace(/\D/g, ''))}
            placeholder="Ex: 2021"
            className="w-full rounded-2xl border border-surface-foreground/15 bg-white px-5 py-4 text-[15px] text-surface-foreground placeholder:text-surface-foreground/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Valor da FIPE */}
      <div>
        <label htmlFor="valorFipe" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Valor aproximado da Tabela FIPE <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-[15px] font-medium text-surface-foreground/50">R$</span>
          <input
            type="text"
            id="valorFipe"
            inputMode="numeric"
            value={rawFipe}
            onChange={(e) => setRawFipe(e.target.value.replace(/\D/g, ''))}
            onBlur={() => valorFipe > 0 && setRawFipe(new Intl.NumberFormat('pt-BR').format(valorFipe))}
            placeholder="0,00"
            className="flex-1 bg-transparent py-4 pr-5 text-[15px] text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
        <p className="mt-1.5 text-xs text-surface-foreground/50">Valor mínimo: {formatCurrency(MIN_FIPE)}</p>
      </div>

      {/* Valor do crédito */}
      <div>
        <label htmlFor="valorCredito" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Quanto você precisa de crédito? <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-[15px] font-medium text-surface-foreground/50">R$</span>
          <input
            type="text"
            id="valorCredito"
            inputMode="numeric"
            value={rawCredito}
            onChange={(e) => setRawCredito(e.target.value.replace(/\D/g, ''))}
            onBlur={() =>
              valorCreditoTyped > 0 && setRawCredito(new Intl.NumberFormat('pt-BR').format(valorCreditoTyped))
            }
            placeholder="0,00"
            className="flex-1 bg-transparent py-4 pr-5 text-[15px] text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
        <p className="mt-1.5 text-xs text-surface-foreground/50">Liberamos até 70% do valor da FIPE</p>
        {showWarning && (
          <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-[oklch(0.83_0.10_85)/30%] bg-[oklch(0.97_0.03_85)] px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[oklch(0.65_0.12_60)]" />
            <p className="text-xs font-medium text-[oklch(0.48_0.07_50)]">
              Valor ajustado ao limite de 70% ({formatCurrency(limite)})
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="mt-2 w-full rounded-2xl bg-background px-5 py-4 text-[15px] font-semibold text-primary transition-opacity disabled:opacity-40"
      >
        Ver minha simulação →
      </button>
    </div>
  )
}
