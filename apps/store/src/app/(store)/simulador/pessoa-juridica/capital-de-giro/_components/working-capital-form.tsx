'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateTermOptions } from '@/lib/utils/simulator'
import { StoreButton } from '@/components/ui/store-button'
import { StoreInput } from '@/components/ui/store-input'
import { StorePhoneInput } from '@/components/ui/store-phone-input'

type Props = {
  productId: string
  minTermMonths: number
  maxTermMonths: number
  maxAmount?: number
  minAmount?: number
}

export function CapitalGiroForm({
  productId,
  minTermMonths,
  maxTermMonths,
  maxAmount: _maxAmount,
  minAmount: _minAmount,
}: Props) {
  const router = useRouter()
  const PARCELAS_OPTIONS = useMemo(
    () => generateTermOptions(minTermMonths, maxTermMonths),
    [minTermMonths, maxTermMonths],
  )
  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [rawDesejado, setRawDesejado] = useState('')
  const [parcelas, setParcelas] = useState<number | null>(null)

  const valorDesejado = Number(rawDesejado.replace(/\D/g, '')) / 100

  const canSubmit =
    nome.trim().split(/\s+/).filter(Boolean).length >= 2 &&
    whatsapp.replace(/\D/g, '').length >= 10 &&
    valorDesejado > 0 &&
    parcelas !== null

  const handleSubmit = () => {
    if (!canSubmit || parcelas === null) return
    const payload = {
      nome: nome.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      valorDesejado,
      parcelas,
    }
    sessionStorage.setItem('sim:capital-giro', JSON.stringify(payload))
    router.push(`/simulador/pessoa-juridica/capital-de-giro/resultado?productId=${productId}`)
  }

  return (
    <div className="space-y-5">
      {/* Chip Pessoa Jurídica */}
      <div className="mb-6 flex justify-center">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-label text-primary-foreground">
          Pessoa Jurídica
        </span>
      </div>

      {/* Nome */}
      <div>
        <label htmlFor="nome" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Nome completo <span className="text-destructive">*</span>
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
        <label htmlFor="whatsapp" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          WhatsApp para contato <span className="text-destructive">*</span>
        </label>
        <StorePhoneInput id="whatsapp" value={whatsapp} onChange={setWhatsapp} />
      </div>

      {/* Valor desejado */}
      <div>
        <label htmlFor="valorDesejado" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Valor desejado <span className="text-destructive">*</span>
        </label>
        <div className="h-11 flex items-center rounded-lg border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/50">R$</span>
          <input
            type="text"
            id="valorDesejado"
            inputMode="numeric"
            value={rawDesejado}
            onChange={(e) => setRawDesejado(e.target.value.replace(/\D/g, ''))}
            onBlur={() =>
              valorDesejado > 0 &&
              setRawDesejado(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valorDesejado))
            }
            placeholder="0,00"
            className="flex-1 bg-transparent pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
      </div>

      {/* Parcelas */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Número de parcelas <span className="text-destructive">*</span>
        </label>
        <div className="flex gap-2">
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
