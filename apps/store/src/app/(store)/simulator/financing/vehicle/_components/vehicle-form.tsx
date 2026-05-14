'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { formatCurrency, generateTermOptions } from '@/lib/utils/simulator'

const ENTRADA_MIN_RATIO = 0.3

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

export function VehicleForm({
  productId,
  minTermMonths,
  maxTermMonths,
  minAmount,
  maxAmount: _maxAmount,
}: Props) {
  const MIN_VEICULO = minAmount ?? 10_000
  const router = useRouter()

  const PARCELAS_OPTIONS = useMemo(
    () => generateTermOptions(minTermMonths, maxTermMonths),
    [minTermMonths, maxTermMonths],
  )

  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [rawVeiculo, setRawVeiculo] = useState('')
  const [rawEntrada, setRawEntrada] = useState('')
  const [parcelas, setParcelas] = useState(() => maxTermMonths ?? 48)

  const valorVeiculo = parseBRL(rawVeiculo)
  const entrada = parseBRL(rawEntrada)
  const entradaMinima = valorVeiculo * ENTRADA_MIN_RATIO
  const valorFinanciado = Math.max(0, valorVeiculo - entrada)

  const showEntradaWarning = valorVeiculo > 0 && entrada > 0 && entrada < entradaMinima

  const canSubmit =
    nome.trim().split(/\s+/).filter(Boolean).length >= 2 &&
    whatsapp.replace(/\D/g, '').length >= 10 &&
    valorVeiculo >= MIN_VEICULO &&
    entrada >= entradaMinima &&
    entrada < valorVeiculo

  function handleSubmit() {
    if (!canSubmit) return
    const payload = {
      nome: nome.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      valorVeiculo,
      entrada,
      parcelas,
    }
    sessionStorage.setItem('sim:financiamento-veiculo', JSON.stringify(payload))
    router.push(`/simulator/financing/vehicle/result?productId=${productId}`)
  }

  return (
    <div className="space-y-5">
      {/* Nome */}
      <div>
        <label
          htmlFor="nome"
          className="mb-1.5 block text-sm font-semibold text-surface-foreground"
        >
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
        <label
          htmlFor="whatsapp"
          className="mb-1.5 block text-sm font-semibold text-surface-foreground"
        >
          WhatsApp para contato <span className="text-red-400">*</span>
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

      {/* Valor do veículo (FIPE) */}
      <div>
        <label
          htmlFor="valorVeiculo"
          className="mb-1.5 block text-sm font-semibold text-surface-foreground"
        >
          Valor do veículo (FIPE) <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-[15px] font-medium text-surface-foreground/50">
            R$
          </span>
          <input
            type="text"
            id="valorVeiculo"
            inputMode="numeric"
            value={rawVeiculo}
            onChange={(e) => setRawVeiculo(e.target.value.replace(/\D/g, ''))}
            onBlur={() =>
              valorVeiculo > 0 &&
              setRawVeiculo(new Intl.NumberFormat('pt-BR').format(valorVeiculo))
            }
            placeholder="0,00"
            className="flex-1 bg-transparent py-4 pr-5 text-[15px] text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
        <p className="mt-1.5 text-xs text-surface-foreground/50">
          Valor mínimo: {formatCurrency(MIN_VEICULO)}
        </p>
      </div>

      {/* Valor de entrada */}
      <div>
        <label
          htmlFor="entrada"
          className="mb-1.5 block text-sm font-semibold text-surface-foreground"
        >
          Valor de entrada <span className="text-red-400">*</span>
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
          <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-[oklch(0.83_0.10_85)/30%] bg-[oklch(0.97_0.03_85)] px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[oklch(0.65_0.12_60)]" />
            <p className="text-xs font-medium text-[oklch(0.48_0.07_50)]">
              Entrada mínima de 30% do valor do veículo
            </p>
          </div>
        )}
      </div>

      {/* Valor a ser financiado (read-only) */}
      {valorVeiculo > 0 && entrada > 0 && (
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
          Prazo <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2 max-sm:grid max-sm:grid-cols-3">
          {PARCELAS_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setParcelas(p)}
              className={`flex-1 rounded-2xl border py-3 text-[15px] font-medium transition-colors ${
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
