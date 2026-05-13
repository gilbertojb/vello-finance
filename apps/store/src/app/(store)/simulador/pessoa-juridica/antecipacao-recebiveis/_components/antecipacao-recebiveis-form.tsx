'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { generateTermOptions } from '@/lib/utils/simulator'

type Props = {
  productId: string
  minTermMonths: number
  maxTermMonths: number
  maxAmount?: number
  minAmount?: number
}

export function AntecipacaoReceiveisForm({
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
  const [rawRecebiveis, setRawRecebiveis] = useState('')
  const [tipoRecebivel, setTipoRecebivel] = useState('')
  const [rawCredito, setRawCredito] = useState('')
  const [parcelas, setParcelas] = useState<number | null>(null)
  const [showAjusteWarning, setShowAjusteWarning] = useState(false)

  const valorRecebiveis = Number(rawRecebiveis.replace(/\D/g, '')) / 100
  const valorCreditoTyped = Number(rawCredito.replace(/\D/g, '')) / 100

  // Limite de 100% dos recebíveis
  const limite = valorRecebiveis
  const valorCredito = valorCreditoTyped > limite && limite > 0 ? limite : valorCreditoTyped

  if (valorCreditoTyped > limite && !showAjusteWarning && valorRecebiveis > 0) {
    setShowAjusteWarning(true)
  } else if ((valorCreditoTyped <= limite || valorRecebiveis === 0) && showAjusteWarning) {
    setShowAjusteWarning(false)
  }

  const canSubmit =
    nome.trim().split(/\s+/).filter(Boolean).length >= 2 &&
    whatsapp.replace(/\D/g, '').length >= 10 &&
    valorRecebiveis > 0 &&
    tipoRecebivel !== '' &&
    valorCredito > 0 &&
    parcelas !== null

  const handleSubmit = () => {
    if (!canSubmit || parcelas === null) return
    const payload = {
      nome: nome.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      valorRecebiveis,
      tipoRecebivel,
      valorCredito,
      parcelas,
    }
    sessionStorage.setItem('sim:antecipacao-recebiveis', JSON.stringify(payload))
    router.push(`/simulador/pessoa-juridica/antecipacao-recebiveis/resultado?productId=${productId}`)
  }

  return (
    <div className="space-y-5">
      {/* Chip Pessoa Jurídica */}
      <div className="mb-6 flex justify-center">
        <span className="inline-flex items-center rounded-full bg-[oklch(0.96_0.03_85)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[oklch(0.48_0.07_50)]">
          Pessoa Jurídica
        </span>
      </div>

      {/* Nome */}
      <div>
        <label htmlFor="nome" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Nome completo <span className="text-red-400">*</span>
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

      {/* Valor total de recebíveis */}
      <div>
        <label htmlFor="valorRecebiveis" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Valor total de recebíveis <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-[15px] font-medium text-surface-foreground/50">R$</span>
          <input
            type="text"
            id="valorRecebiveis"
            inputMode="numeric"
            value={rawRecebiveis}
            onChange={(e) => setRawRecebiveis(e.target.value.replace(/\D/g, ''))}
            onBlur={() =>
              valorRecebiveis > 0 &&
              setRawRecebiveis(new Intl.NumberFormat('pt-BR').format(valorRecebiveis))
            }
            placeholder="0,00"
            className="flex-1 bg-transparent py-4 pr-5 text-[15px] text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
      </div>

      {/* Tipo de recebível */}
      <div>
        <label htmlFor="tipoRecebivel" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Tipo de recebível <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <select
            id="tipoRecebivel"
            value={tipoRecebivel}
            onChange={(e) => setTipoRecebivel(e.target.value)}
            className="w-full appearance-none rounded-2xl border border-surface-foreground/15 bg-white px-5 py-4 text-[15px] text-surface-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Selecione o tipo de recebível</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Boleto">Boleto</option>
            <option value="NF-e">NF-e</option>
            <option value="Contrato">Contrato</option>
            <option value="Duplicata">Duplicata</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>

      {/* Valor de crédito desejado */}
      <div>
        <label htmlFor="valorCredito" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Valor de crédito desejado <span className="text-red-400">*</span>
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
              valorCreditoTyped > 0 &&
              setRawCredito(new Intl.NumberFormat('pt-BR').format(valorCreditoTyped))
            }
            placeholder="0,00"
            className="flex-1 bg-transparent py-4 pr-5 text-[15px] text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
        {showAjusteWarning && (
          <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-[oklch(0.83_0.10_85)/30%] bg-[oklch(0.97_0.03_85)] px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[oklch(0.65_0.12_60)]" />
            <p className="text-xs font-medium text-[oklch(0.48_0.07_50)]">
              Valor ajustado ao limite de 100% dos seus recebíveis
            </p>
          </div>
        )}
      </div>

      {/* Parcelas */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Número de parcelas <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
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
