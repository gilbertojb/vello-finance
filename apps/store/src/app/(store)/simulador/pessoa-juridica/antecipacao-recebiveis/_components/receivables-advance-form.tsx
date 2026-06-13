'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
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

export function AntecipacaoReceiveisForm({
  productId,
  minTermMonths: _minTermMonths,
  maxTermMonths: _maxTermMonths,
  maxAmount: _maxAmount,
  minAmount: _minAmount,
}: Props) {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [rawRecebiveis, setRawRecebiveis] = useState('')
  const [tipoRecebivel, setTipoRecebivel] = useState('')
  const [rawCredito, setRawCredito] = useState('')
  const [prazo, setPrazo] = useState<number | null>(null)
  const [showAjusteWarning, setShowAjusteWarning] = useState(false)

  const prazoOptions = useMemo(
    () => (tipoRecebivel === 'NF-e' || tipoRecebivel === 'Contrato') ? [30, 60, 90, 190] : [30, 60, 90],
    [tipoRecebivel],
  )

  useEffect(() => {
    if (prazo !== null && !prazoOptions.includes(prazo)) setPrazo(null)
  }, [prazoOptions, prazo])

  const valorRecebiveis = Number(rawRecebiveis.replace(/\D/g, '')) / 100
  const valorCreditoTyped = Number(rawCredito.replace(/\D/g, '')) / 100

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
    prazo !== null

  const handleSubmit = () => {
    if (!canSubmit || prazo === null) return
    const payload = {
      nome: nome.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      valorRecebiveis,
      tipoRecebivel,
      valorCredito,
      prazo,
    }
    sessionStorage.setItem('sim:antecipacao-recebiveis', JSON.stringify(payload))
    router.push(`/simulador/pessoa-juridica/antecipacao-recebiveis/resultado?productId=${productId}`)
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

      {/* Valor total de recebíveis */}
      <div>
        <label htmlFor="valorRecebiveis" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Valor total de recebíveis <span className="text-destructive">*</span>
        </label>
        <div className="flex h-11 items-center rounded-lg border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/50">R$</span>
          <input
            type="text"
            id="valorRecebiveis"
            inputMode="numeric"
            value={rawRecebiveis}
            onChange={(e) => setRawRecebiveis(e.target.value.replace(/\D/g, ''))}
            onBlur={() =>
              valorRecebiveis > 0 &&
              setRawRecebiveis(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valorRecebiveis))
            }
            placeholder="0,00"
            className="flex-1 bg-transparent pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
      </div>

      {/* Tipo de recebível */}
      <div>
        <label htmlFor="tipoRecebivel" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Tipo de recebível <span className="text-destructive">*</span>
        </label>
        <Select value={tipoRecebivel || undefined} onValueChange={setTipoRecebivel}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o tipo de recebível" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
            <SelectItem value="Boleto">Boleto</SelectItem>
            <SelectItem value="NF-e">NF-e</SelectItem>
            <SelectItem value="Contrato">Contrato</SelectItem>
            <SelectItem value="Duplicata">Duplicata</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Valor de crédito desejado */}
      <div>
        <label htmlFor="valorCredito" className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Valor de crédito desejado <span className="text-destructive">*</span>
        </label>
        <div className="flex h-11 items-center rounded-lg border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-sm font-medium text-surface-foreground/50">R$</span>
          <input
            type="text"
            id="valorCredito"
            inputMode="numeric"
            value={rawCredito}
            onChange={(e) => setRawCredito(e.target.value.replace(/\D/g, ''))}
            onBlur={() =>
              valorCreditoTyped > 0 &&
              setRawCredito(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valorCreditoTyped))
            }
            placeholder="0,00"
            className="flex-1 bg-transparent pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
        {showAjusteWarning && (
          <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary/70" />
            <p className="text-xs font-medium text-surface-foreground/80">
              Valor ajustado ao limite de 100% dos seus recebíveis
            </p>
          </div>
        )}
      </div>

      {/* Prazo */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-surface-foreground">
          Prazo <span className="text-destructive">*</span>
        </label>
        <div className="flex gap-2">
          {prazoOptions.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPrazo(p)}
              className={`flex-1 rounded-2xl border py-3 text-sm font-medium transition-colors ${
                prazo === p
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-surface-foreground/12 bg-surface-foreground/5 text-surface-foreground/60 hover:bg-surface-foreground/10'
              }`}
            >
              {p} dias
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
