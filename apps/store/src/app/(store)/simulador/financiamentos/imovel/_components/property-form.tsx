'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { formatCurrency, generateTermOptions } from '@/lib/utils/simulator'

const ENTRADA_MIN_RATIO = 0.2

function parseBRL(raw: string): number {
  return Math.max(0, Number(raw.replace(/\D/g, '')) || 0)
}

type Props = {
  productId: string
  minTermMonths: number
  maxTermMonths: number
  minAmount?: number
  maxAmount?: number
}

export function PropertyForm({
  productId,
  minTermMonths,
  maxTermMonths,
  minAmount,
  maxAmount: _maxAmount,
}: Props) {
  const MIN_IMOVEL = minAmount ?? 150_000
  const router = useRouter()

  const PARCELAS_OPTIONS = useMemo(
    () => generateTermOptions(minTermMonths, maxTermMonths),
    [minTermMonths, maxTermMonths],
  )

  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [rawImovel, setRawImovel] = useState('')
  const [rawEntrada, setRawEntrada] = useState('')
  const [parcelas, setParcelas] = useState(() => maxTermMonths ?? 360)

  const valorImovel = parseBRL(rawImovel)
  const entrada = parseBRL(rawEntrada)
  const entradaMinima = valorImovel * ENTRADA_MIN_RATIO
  const valorFinanciado = Math.max(0, valorImovel - entrada)

  const showEntradaWarning = valorImovel > 0 && entrada > 0 && entrada < entradaMinima

  const canSubmit =
    nome.trim().split(/\s+/).filter(Boolean).length >= 2 &&
    whatsapp.replace(/\D/g, '').length >= 10 &&
    valorImovel >= MIN_IMOVEL &&
    entrada >= entradaMinima &&
    entrada < valorImovel

  function handleSubmit() {
    if (!canSubmit) return
    const payload = {
      nome: nome.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      valorImovel,
      entrada,
      parcelas,
    }
    sessionStorage.setItem('sim:financiamento-imovel', JSON.stringify(payload))
    router.push(`/simulador/financiamentos/imovel/resultado?productId=${productId}`)
  }

  return (
    <div className="space-y-5">
      {/* Nome */}
      <div>
        <label
          htmlFor="nome"
          className="mb-1.5 block text-sm font-semibold text-surface-foreground"
        >
          Seu nome completo <span className="text-destructive">*</span>
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
        <label
          htmlFor="whatsapp"
          className="mb-1.5 block text-sm font-semibold text-surface-foreground"
        >
          WhatsApp para contato <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-3 text-[15px] font-medium text-surface-foreground/40">
            +55
          </span>
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

      {/* Valor do imóvel */}
      <div>
        <label
          htmlFor="valorImovel"
          className="mb-1.5 block text-sm font-semibold text-surface-foreground"
        >
          Valor do imóvel <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-[15px] font-medium text-surface-foreground/50">
            R$
          </span>
          <input
            type="text"
            id="valorImovel"
            inputMode="numeric"
            value={rawImovel}
            onChange={(e) => setRawImovel(e.target.value.replace(/\D/g, ''))}
            onBlur={() =>
              valorImovel > 0 &&
              setRawImovel(new Intl.NumberFormat('pt-BR').format(valorImovel))
            }
            placeholder="0,00"
            className="flex-1 bg-transparent py-4 pr-5 text-[15px] text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
        <p className="mt-1.5 text-xs text-surface-foreground/50">
          Valor mínimo: {formatCurrency(MIN_IMOVEL)}
        </p>
      </div>

      {/* Valor de entrada */}
      <div>
        <label
          htmlFor="entrada"
          className="mb-1.5 block text-sm font-semibold text-surface-foreground"
        >
          Valor de entrada <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-[15px] font-medium text-surface-foreground/50">
            R$
          </span>
          <input
            type="text"
            id="entrada"
            inputMode="numeric"
            value={rawEntrada}
            onChange={(e) => setRawEntrada(e.target.value.replace(/\D/g, ''))}
            onBlur={() =>
              entrada > 0 &&
              setRawEntrada(new Intl.NumberFormat('pt-BR').format(entrada))
            }
            placeholder="0,00"
            className="flex-1 bg-transparent py-4 pr-5 text-[15px] text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
        {showEntradaWarning && (
          <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary/70" />
            <p className="text-xs font-medium text-surface-foreground/80">
              Entrada mínima de 20% do valor do imóvel
            </p>
          </div>
        )}
      </div>

      {/* Valor a ser financiado (read-only) */}
      {valorImovel > 0 && entrada > 0 && (
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-surface-foreground">
            Valor a ser financiado
          </label>
          <div className="rounded-2xl border border-surface-foreground/15 bg-surface px-5 py-4 text-[15px] font-semibold text-surface-foreground">
            {formatCurrency(valorFinanciado)}
          </div>
        </div>
      )}

      {/* Parcelas */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Prazo <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-2">
          {PARCELAS_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setParcelas(p)}
              className={`rounded-2xl border py-3 text-[15px] font-medium transition-colors ${
                parcelas === p
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-surface-foreground/12 bg-white text-surface-foreground/60 hover:bg-surface'
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
        className="mt-2 w-full rounded-2xl bg-background px-5 py-4 text-[15px] font-semibold text-primary transition-opacity disabled:opacity-40"
      >
        Ver minha simulação →
      </button>
    </div>
  )
}
