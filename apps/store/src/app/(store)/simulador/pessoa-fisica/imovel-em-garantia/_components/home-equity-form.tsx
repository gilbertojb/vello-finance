'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/simulator'

const LTV_LIMIT = 0.6

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
  const [valorLiberado, setValorLiberado] = useState('')

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
    (!showInstituicao || (instituicao.trim().length > 0 && parseBRL(valorLiberado) > 0))

  function handleSubmit() {
    if (!canSubmit) return
    const payload = {
      nome: nome.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      valorImovel,
      valorCredito,
      outroCredito,
      instituicao: showInstituicao ? instituicao.trim() : undefined,
      valorLiberado: showInstituicao ? parseBRL(valorLiberado) : undefined,
    }
    const key = isPj ? 'sim:home-equity-pj' : 'sim:home-equity'
    sessionStorage.setItem(key, JSON.stringify(payload))

    const route = isPj
      ? '/simulador/pessoa-juridica/imovel-em-garantia/resultado'
      : '/simulador/pessoa-fisica/imovel-em-garantia/resultado'
    router.push(`${route}?productId=${productId}`)
  }

  return (
    <div className="space-y-5">
      {/* Chip Pessoa */}
      <div className="mb-6 flex justify-center">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-label text-primary-foreground">
          {isPj ? 'Pessoa Jurídica' : 'Pessoa Física'}
        </span>
      </div>

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
          className="h-11 w-full rounded-lg border border-surface-foreground/15 bg-white px-4 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
        <div className="h-11 flex items-center rounded-lg border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-3 text-sm font-medium text-surface-foreground/40">
            +55
          </span>
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

      {/* Valor do imóvel */}
      <div>
        <label
          htmlFor="valorImovel"
          className="mb-1.5 block text-sm font-semibold text-surface-foreground"
        >
          Valor do Imóvel <span className="text-destructive">*</span>
        </label>
        <div className="h-11 flex items-center rounded-lg border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/50">
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
            className="flex-1 bg-transparent pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
        <p className="mt-1.5 text-xs text-surface-foreground/50">
          Valor mínimo: {formatCurrency(MIN_IMOVEL)}
        </p>
        {valorImovel > 0 && valorImovel < MIN_IMOVEL && (
          <p className="mt-1.5 text-xs font-medium text-destructive">
            O valor mínimo do imóvel para esta operação é de {formatCurrency(MIN_IMOVEL)}. Infelizmente, não podemos continuar.
          </p>
        )}
      </div>

      {/* Valor do crédito */}
      <div>
        <label
          htmlFor="valorCredito"
          className="mb-1.5 block text-sm font-semibold text-surface-foreground"
        >
          Quanto você precisa de crédito?{' '}
          <span className="text-destructive">*</span>
        </label>
        <div className="h-11 flex items-center rounded-lg border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/50">
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
            className="flex-1 bg-transparent pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
        <p className="mt-1.5 text-xs text-surface-foreground/50">
          Liberamos até 60% do valor do imóvel
        </p>
        {showWarning && (
          <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
            <p className="text-xs font-medium text-destructive/90">
              O valor solicitado ultrapassa o limite permitido (60% do imóvel). Ajustamos automaticamente para {formatCurrency(limite)}.
            </p>
          </div>
        )}
      </div>

      {/* Já tem crédito em outro banco */}
      <div>
        <label className="block text-sm font-semibold text-surface-foreground">
          <span className="mb-1.5 block">
            Já tem crédito solicitado em outro banco? <span className="text-destructive">*</span>
          </span>
          <div className="relative">
            <select
              id="outroCredito"
              value={outroCredito}
              onChange={(e) => setOutroCredito(e.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-surface-foreground/15 bg-white px-4 text-sm text-surface-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
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

      {/* Banco / instituição e valor liberado (condicional) */}
      {showInstituicao && (
        <>
          <div>
            <label
              htmlFor="instituicao"
              className="mb-1.5 block text-sm font-semibold text-surface-foreground"
            >
              Qual banco ou instituição? <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="instituicao"
              value={instituicao}
              onChange={(e) => setInstituicao(e.target.value)}
              placeholder="Ex: Itaú, Bradesco..."
              className="h-11 w-full rounded-lg border border-surface-foreground/15 bg-white px-4 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label
              htmlFor="valorLiberado"
              className="mb-1.5 block text-sm font-semibold text-surface-foreground"
            >
              Valor já liberado <span className="text-destructive">*</span>
            </label>
            <div className="h-11 flex items-center rounded-lg border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
              <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/50">R$</span>
              <input
                type="text"
                id="valorLiberado"
                inputMode="numeric"
                value={valorLiberado}
                onChange={(e) => setValorLiberado(e.target.value.replace(/\D/g, ''))}
                onBlur={() => {
                  const v = parseBRL(valorLiberado)
                  if (v > 0) setValorLiberado(new Intl.NumberFormat('pt-BR').format(v))
                }}
                placeholder="0"
                className="flex-1 bg-transparent pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
              />
            </div>
          </div>
        </>
      )}

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
