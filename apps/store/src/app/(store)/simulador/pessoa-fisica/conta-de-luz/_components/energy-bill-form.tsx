'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { generateTermOptions, formatCurrency } from '@/lib/utils/simulator'
import { StoreButton } from '@/components/ui/store-button'
import { StoreInput } from '@/components/ui/store-input'
import { StorePhoneInput } from '@/components/ui/store-phone-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

      {/* Distribuidora */}
      <div>
        <label htmlFor="distribuidora" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Distribuidora de energia <span className="text-destructive">*</span>
        </label>
        <Select value={distribuidora || undefined} onValueChange={setDistribuidora}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione sua distribuidora" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Enel">Enel</SelectItem>
            <SelectItem value="CPFL">CPFL</SelectItem>
            <SelectItem value="Light">Light</SelectItem>
            <SelectItem value="Cemig">Cemig</SelectItem>
            <SelectItem value="Coelba">Coelba</SelectItem>
            <SelectItem value="Energisa">Energisa</SelectItem>
            <SelectItem value="Equatorial">Equatorial</SelectItem>
            <SelectItem value="Outras">Outras</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Valor desejado */}
      <div>
        <label htmlFor="valorDesejado" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Valor desejado <span className="text-destructive">*</span>
        </label>
        <div className="flex h-11 items-center rounded-lg border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/50">R$</span>
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
            className="flex-1 bg-transparent pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
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
