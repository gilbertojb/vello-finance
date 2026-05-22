'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/simulator'
import { StoreButton } from '@/components/ui/store-button'
import { StoreInput } from '@/components/ui/store-input'
import { StorePhoneInput } from '@/components/ui/store-phone-input'

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

const PARCELAS_OPTIONS = [15, 25, 35, 45, 60, 90]

export function VehicleForm({
  productId,
  minTermMonths: _minTermMonths,
  maxTermMonths: _maxTermMonths,
  minAmount,
  maxAmount: _maxAmount,
}: Props) {
  const MIN_VEICULO = minAmount ?? 10_000
  const router = useRouter()

  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [rawVeiculo, setRawVeiculo] = useState('')
  const [rawEntrada, setRawEntrada] = useState('')
  const [parcelas, setParcelas] = useState(90)

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
    router.push(`/simulador/financiamentos/veiculo/resultado?productId=${productId}`)
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
        <StoreInput
          type="text"
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Como consta no seu documento"
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
        <StorePhoneInput id="whatsapp" value={whatsapp} onChange={setWhatsapp} />
      </div>

      {/* Valor do veículo (FIPE) */}
      <div>
        <label
          htmlFor="valorVeiculo"
          className="mb-1.5 block text-sm font-semibold text-surface-foreground"
        >
          Valor do veículo (FIPE) <span className="text-destructive">*</span>
        </label>
        <div className="h-11 flex items-center rounded-lg border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/50">
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
            className="flex-1 bg-transparent pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
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
          Valor de entrada <span className="text-destructive">*</span>
        </label>
        <div className="h-11 flex items-center rounded-lg border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/50">
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
            className="flex-1 bg-transparent pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
        {showEntradaWarning && (
          <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary/70" />
            <p className="text-xs font-medium text-surface-foreground/80">
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
          <div className="h-11 flex items-center rounded-lg border border-surface-foreground/15 bg-surface px-4 text-sm font-semibold text-surface-foreground">
            {formatCurrency(valorFinanciado)}
          </div>
        </div>
      )}

      {/* Parcelas */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Prazo <span className="text-destructive">*</span>
        </label>
        <div className="flex gap-2 max-sm:grid max-sm:grid-cols-3">
          {PARCELAS_OPTIONS.map((p) => (
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

      <StoreButton
        type="button"
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="mt-2 w-full"
      >
        Ver minha simulação →
      </StoreButton>
    </div>
  )
}
