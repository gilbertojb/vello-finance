'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = { productId: string; minRateMonthly?: number }

export function FgtsForm({ productId, minRateMonthly: _minRateMonthly }: Props) {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [rawSaldo, setRawSaldo] = useState('')

  const saldoFgts = Math.max(0, Number(rawSaldo.replace(/\D/g, '')) || 0)

  const canSubmit =
    nome.trim().split(/\s+/).filter(Boolean).length >= 2 &&
    whatsapp.replace(/\D/g, '').length >= 10 &&
    saldoFgts > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    const payload = {
      nome: nome.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      saldoFgts,
    }
    sessionStorage.setItem('sim:fgts', JSON.stringify(payload))
    router.push(`/simulador/pessoa-fisica/fgts/resultado?productId=${productId}`)
  }

  return (
    <div className="space-y-5">
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
          className="h-11 w-full rounded-lg border border-surface-foreground/15 bg-white px-4 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* WhatsApp */}
      <div>
        <label htmlFor="whatsapp" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          WhatsApp para contato <span className="text-destructive">*</span>
        </label>
        <div className="h-11 flex items-center rounded-lg border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-3 text-sm font-medium text-surface-foreground/40">+55</span>
          <div className="h-5 w-px bg-surface-foreground/12" />
          <input
            type="tel"
            id="whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="(11) 99999-9999"
            className="flex-1 bg-transparent pl-3 pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
      </div>

      {/* Saldo FGTS */}
      <div>
        <label htmlFor="saldoFgts" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Saldo aproximado do FGTS <span className="text-destructive">*</span>
        </label>
        <div className="h-11 flex items-center rounded-lg border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/50">R$</span>
          <input
            type="text"
            id="saldoFgts"
            inputMode="numeric"
            value={rawSaldo}
            onChange={(e) => setRawSaldo(e.target.value.replace(/\D/g, ''))}
            onBlur={() => saldoFgts > 0 && setRawSaldo(new Intl.NumberFormat('pt-BR').format(saldoFgts))}
            placeholder="0,00"
            className="flex-1 bg-transparent pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
        <p className="mt-1.5 text-xs text-surface-foreground/50">
          Consulte seu saldo no aplicativo FGTS ou extrato da Caixa
        </p>
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="mt-2 w-full h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-surface-foreground transition-opacity disabled:opacity-40"
      >
        Ver minha simulação →
      </button>
    </div>
  )
}
