'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatCurrency, formatRate } from '@/lib/utils/simulator'

type Props = {
  tenantProductId: string
  minAmount: number
  maxAmount: number
  termOptions: number[]
  minRate: number
  initialAmount: number
  initialTerm: number
}

export function SimulatorPanel({
  tenantProductId,
  minAmount,
  maxAmount,
  termOptions,
  minRate,
  initialAmount,
  initialTerm,
}: Props) {
  const router = useRouter()
  const [amount, setAmount] = useState(initialAmount)
  const [term, setTerm] = useState(initialTerm)

  return (
    <div className="space-y-8 rounded-2xl border border-border bg-card p-6">
      {/* Slider de valor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Valor desejado</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(amount)}</span>
        </div>
        <Slider
          min={minAmount}
          max={maxAmount}
          step={1000}
          value={[amount]}
          onValueChange={([v]) => setAmount(v)}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatCurrency(minAmount)}</span>
          <span>{formatCurrency(maxAmount)}</span>
        </div>
      </div>

      {/* Tabs de prazo */}
      <div className="space-y-3">
        <span className="text-sm font-medium text-foreground">Prazo</span>
        <div className="flex gap-2">
          {termOptions.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTerm(t)}
              className={cn(
                'flex-1 rounded-md border py-2 text-sm font-medium transition-colors',
                term === t
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary',
              )}
            >
              {t % 12 === 0 ? `${t / 12}a` : `${t}m`}
            </button>
          ))}
        </div>
      </div>

      {/* Resultado */}
      <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Parcela estimada</p>
          <p className="mt-1 text-3xl font-bold text-foreground">R$ --,--</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cálculo disponível em breve
          </p>
        </div>
        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total a pagar</span>
            <span className="font-medium text-foreground">R$ --,--</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxa a partir de</span>
            <span className="font-medium text-foreground">{formatRate(minRate)}% a.m.</span>
          </div>
        </div>
        <Button
          className="w-full"
          onClick={() =>
            router.push(`/solicitar/${tenantProductId}?amount=${amount}&term=${term}`)
          }
        >
          Solicitar agora
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.back()}
        >
          ← Voltar
        </Button>
      </div>
    </div>
  )
}
