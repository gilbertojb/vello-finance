'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/simulator'

const LTV_LIMIT = 0.5

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

export function HomeEquityForm({
  productId,
  isPj = false,
  minTermMonths: _minTermMonths,
  maxTermMonths: _maxTermMonths,
  minAmount,
  maxAmount: _maxAmount,
}: Props) {
  const router = useRouter()

  const MIN_IMOVEL = minAmount ?? 150_000

  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [rawImovel, setRawImovel] = useState('')
  const [rawCredito, setRawCredito] = useState('')
  const [outroCredito, setOutroCredito] = useState('')
  const [instituicao, setInstituicao] = useState('')

  const valorImovel = parseBRL(rawImovel)
  const valorCreditoTyped = parseBRL(rawCredito)
  const limite = valorImovel * LTV_LIMIT
  const valorCredito = Math.min(
    valorCreditoTyped,
    limite > 0 ? limite : Infinity,
  )
  const showWarning =
    valorImovel > 0 && valorCreditoTyped > limite && limite > 0
  const showInstituicao = outroCredito === 'sim'

  const canSubmit =
    nome.trim().length >= 3 &&
    whatsapp.replace(/\D/g, '').length >= 10 &&
    valorImovel >= MIN_IMOVEL &&
    valorCredito > 0 &&
    outroCredito !== '' &&
    (!showInstituicao || instituicao.trim().length > 0)

  function handleSubmit() {
    if (!canSubmit) return
    const payload = {
      nome: nome.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      valorImovel,
      valorCredito,
      outroCredito,
      instituicao: showInstituicao ? instituicao.trim() : undefined,
    }
    const key = isPj ? 'sim:home-equity-pj' : 'sim:home-equity'
    sessionStorage.setItem(key, JSON.stringify(payload))

    const route = isPj
      ? '/simulator/business/home-equity-pj/result'
      : '/simulator/individual/home-equity/result'
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

      {/* Valor do imóvel */}
      <div>
        <label
          htmlFor="valorImovel"
          className="mb-1.5 block text-sm font-semibold text-surface-foreground"
        >
          Valor de avaliação do imóvel <span className="text-red-400">*</span>
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

      {/* Valor do crédito */}
      <div>
        <label
          htmlFor="valorCredito"
          className="mb-1.5 block text-sm font-semibold text-surface-foreground"
        >
          Quanto você precisa de crédito?{' '}
          <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-[15px] font-medium text-surface-foreground/50">
            R$
          </span>
          <input
            type="text"
            id="valorCredito"
            inputMode="numeric"
            value={rawCredito}
            onChange={(e) => setRawCredito(e.target.value.replace(/\D/g, ''))}
            onBlur={() =>
              valorCreditoTyped > 0 &&
              setRawCredito(
                new Intl.NumberFormat('pt-BR').format(valorCreditoTyped),
              )
            }
            placeholder="0,00"
            className="flex-1 bg-transparent py-4 pr-5 text-[15px] text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
        <p className="mt-1.5 text-xs text-surface-foreground/50">
          Liberamos até 50% do valor do imóvel
        </p>
        {showWarning && (
          <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-[oklch(0.83_0.10_85)/30%] bg-[oklch(0.97_0.03_85)] px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[oklch(0.65_0.12_60)]" />
            <p className="text-xs font-medium text-[oklch(0.48_0.07_50)]">
              Valor ajustado ao limite de 50% do imóvel ({formatCurrency(limite)})
            </p>
          </div>
        )}
      </div>

      {/* Já tem crédito em outro banco */}
      <div>
        <label className="block text-sm font-semibold text-surface-foreground">
          <span className="mb-1.5 block">
            Já tem crédito solicitado em outro banco? <span className="text-red-400">*</span>
          </span>
          <div className="relative">
            <select
              id="outroCredito"
              value={outroCredito}
              onChange={(e) => setOutroCredito(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-surface-foreground/15 bg-white px-5 py-4 text-[15px] text-surface-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="" disabled>
                Selecione...
              </option>
              <option value="nao">Não</option>
              <option value="sim">Sim, já tenho uma proposta</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
          </div>
        </label>
      </div>

      {/* Banco / instituição (condicional) */}
      {showInstituicao && (
        <div>
          <label
            htmlFor="instituicao"
            className="mb-1.5 block text-sm font-semibold text-surface-foreground"
          >
            Qual banco ou instituição? <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="instituicao"
            value={instituicao}
            onChange={(e) => setInstituicao(e.target.value)}
            placeholder="Ex: Itaú, Bradesco..."
            className="w-full rounded-2xl border border-surface-foreground/15 bg-white px-5 py-4 text-[15px] text-surface-foreground placeholder:text-surface-foreground/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}

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
