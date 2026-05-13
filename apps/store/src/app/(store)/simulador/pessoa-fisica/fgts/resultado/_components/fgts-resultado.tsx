'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Info, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatRate } from '@/lib/utils/simulator'

type Props = {
  productId: string
  productName: string
  rateMonthly: number
}

type SimData = {
  nome: string
  whatsapp: string
  saldoFgts: number
}

export function FgtsResultado({ productId, productName, rateMonthly }: Props) {
  const router = useRouter()
  const [data, setData] = useState<SimData | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('sim:fgts')
    if (!stored) {
      router.replace(`/simulador/pessoa-fisica/fgts?productId=${productId}`)
      return
    }
    try {
      setData(JSON.parse(stored))
    } catch {
      router.replace(`/simulador/pessoa-fisica/fgts?productId=${productId}`)
    }
  }, [router, productId])

  if (!data) {
    return (
      <div className="py-12 text-center text-sm text-surface-foreground/50">
        Carregando dados da simulação...
      </div>
    )
  }

  const estimativa = data.saldoFgts * 0.75

  return (
    <div className="space-y-5">
      <div className="mb-4">
        <p className="text-[15px] font-medium text-surface-foreground">Olá, {data.nome}!</p>
      </div>

      {/* Dados do saldo */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Saldo informado
          </label>
          <div className="rounded-2xl border border-surface-foreground/12 bg-surface px-4 py-3 text-[15px] font-semibold text-surface-foreground">
            {formatCurrency(data.saldoFgts)}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-foreground/55">
            Prazo máximo
          </label>
          <div className="rounded-2xl border border-surface-foreground/12 bg-surface px-4 py-3 text-[15px] font-semibold text-surface-foreground">
            120 meses
          </div>
        </div>
      </div>

      {/* Card de resultado */}
      <div className="rounded-2xl bg-surface-foreground p-6 text-white max-sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-medium text-white/70">Valor estimado de antecipação</h3>
            <p className="text-[11px] text-white/40">75% do saldo informado</p>
          </div>
          <p className="text-[28px] font-bold leading-none tracking-tight text-white">
            <span className="text-[15px] font-medium text-white/50">R$</span>{' '}
            {estimativa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="mb-0.5 text-white/40">Saldo FGTS</p>
              <p className="font-medium text-white/90">{formatCurrency(data.saldoFgts)}</p>
            </div>
            <div>
              <p className="mb-0.5 text-white/40">Taxa ref.</p>
              <p className="font-medium text-white/90">{formatRate(rateMonthly)}% a.m.</p>
            </div>
            <div>
              <p className="mb-0.5 text-white/40">Prazo máx.</p>
              <p className="font-medium text-white/90">10 anos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso estimativa */}
      <div className="flex items-start gap-2.5 rounded-xl border border-[oklch(0.83_0.10_85)/30%] bg-[oklch(0.97_0.03_85)] px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[oklch(0.65_0.12_60)]" />
        <p className="text-xs leading-relaxed text-[oklch(0.48_0.07_50)]">
          Valor estimado sujeito a análise e saldo verificado na CEF. Consulte o extrato atualizado no
          aplicativo FGTS ou nas agências da Caixa Econômica Federal.
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-primary/80">
          A antecipação do FGTS ({productName}) não tem cobrança de parcelas mensais. O saldo futuro do
          FGTS é utilizado automaticamente para amortizar o valor antecipado.
        </p>
      </div>

      <button
        type="button"
        onClick={() => router.push(`/solicitar/${productId}`)}
        className="w-full rounded-2xl bg-background px-5 py-4 text-[15px] font-semibold text-primary transition-opacity hover:opacity-90"
      >
        Quero contratar →
      </button>
    </div>
  )
}
