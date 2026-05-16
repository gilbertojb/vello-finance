'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { generateTermOptions, formatCurrency } from '@/lib/utils/simulator'

type Props = {
  productId: string
  minTermMonths: number
  maxTermMonths: number
  maxAmount?: number
  minAmount?: number
}

export function ContaLuzForm({
  productId,
  minTermMonths,
  maxTermMonths,
  maxAmount,
  minAmount: _minAmount,
}: Props) {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [distribuidora, setDistribuidora] = useState('')
  const [rawValor, setRawValor] = useState('')
  const [parcelas, setParcelas] = useState<number | null>(null)
  const [showMaxWarning, setShowMaxWarning] = useState(false)

  const teto = maxAmount ?? 2100
  const PARCELAS_OPTIONS = useMemo(
    () => generateTermOptions(minTermMonths, maxTermMonths),
    [minTermMonths, maxTermMonths],
  )

  const valorTyped = Number(rawValor.replace(/\D/g, '')) / 100
  const valorDesejado = valorTyped > teto ? teto : valorTyped

  const handleValorChange = (v: string) => {
    const digits = v.replace(/\D/g, '')
    setRawValor(digits)
    const parsed = Number(digits) / 100
    if (parsed > teto) {
      setShowMaxWarning(true)
    } else {
      setShowMaxWarning(false)
    }
  }

  const canSubmit =
    nome.trim().split(/\s+/).filter(Boolean).length >= 2 &&
    whatsapp.replace(/\D/g, '').length >= 10 &&
    distribuidora !== '' &&
    valorDesejado > 0 &&
    parcelas !== null

  const handleSubmit = () => {
    if (!canSubmit || parcelas === null) return
    const payload = {
      nome: nome.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      distribuidora,
      valorDesejado,
      parcelas,
    }
    sessionStorage.setItem('sim:conta-luz', JSON.stringify(payload))
    router.push(`/simulador/pessoa-fisica/conta-de-luz/resultado?productId=${productId}`)
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
          className="w-full rounded-2xl border border-surface-foreground/15 bg-white px-5 py-4 text-[15px] text-surface-foreground placeholder:text-surface-foreground/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* WhatsApp */}
      <div>
        <label htmlFor="whatsapp" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          WhatsApp para contato <span className="text-destructive">*</span>
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

      {/* Distribuidora */}
      <div>
        <label htmlFor="distribuidora" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Distribuidora de energia <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <select
            id="distribuidora"
            value={distribuidora}
            onChange={(e) => setDistribuidora(e.target.value)}
            className="w-full appearance-none rounded-2xl border border-surface-foreground/15 bg-white px-5 py-4 text-[15px] text-surface-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Selecione sua distribuidora</option>
            <option value="Enel">Enel</option>
            <option value="CPFL">CPFL</option>
            <option value="Light">Light</option>
            <option value="Cemig">Cemig</option>
            <option value="Coelba">Coelba</option>
            <option value="Energisa">Energisa</option>
            <option value="Equatorial">Equatorial</option>
            <option value="Outras">Outras</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>

      {/* Valor desejado */}
      <div>
        <label htmlFor="valorDesejado" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Valor desejado <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-[15px] font-medium text-surface-foreground/50">R$</span>
          <input
            type="text"
            id="valorDesejado"
            inputMode="numeric"
            value={rawValor}
            onChange={(e) => handleValorChange(e.target.value)}
            onBlur={() =>
              valorTyped > 0 &&
              setRawValor(new Intl.NumberFormat('pt-BR').format(valorTyped > teto ? teto : valorTyped))
            }
            placeholder="0,00"
            className="flex-1 bg-transparent py-4 pr-5 text-[15px] text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
        <p className="mt-1.5 text-xs text-surface-foreground/50">Valor máximo: {formatCurrency(teto)}</p>
        {showMaxWarning && (
          <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary/70" />
            <p className="text-xs font-medium text-surface-foreground/80">
              Valor máximo: {formatCurrency(teto)}
            </p>
          </div>
        )}
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
