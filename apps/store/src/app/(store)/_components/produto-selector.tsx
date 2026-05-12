'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

export type ProdutoOption = {
  tenantProductId: string
  label: string
  productName: string
  href: string
}

export function ProdutoSelector({ options }: { options: ProdutoOption[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState('')

  const selectedOption = options.find((o) => o.tenantProductId === selected)

  if (options.length === 0) {
    return (
      <p className="text-sm text-surface-foreground/50">
        Nenhum produto disponível no momento.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-2 block text-sm font-semibold text-surface-foreground">
          Produto
        </label>
        <div className="relative">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full appearance-none rounded-2xl border border-primary/30 bg-white px-5 py-4 text-[15px] text-surface-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="" disabled>Selecione um produto...</option>
            {options.map((o) => (
              <option key={o.tenantProductId} value={o.tenantProductId}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>

      {selectedOption && (
        <div className="rounded-2xl border border-[oklch(0.90_0.04_85)] bg-[oklch(0.97_0.02_85)] px-5 py-4 text-[15px] font-medium text-surface-foreground">
          {selectedOption.productName}
        </div>
      )}

      <button
        type="button"
        disabled={!selected}
        onClick={() => selectedOption && router.push(selectedOption.href)}
        className="w-full rounded-2xl bg-background px-5 py-4 text-[15px] font-semibold text-primary transition-opacity disabled:opacity-40"
      >
        Continuar →
      </button>
    </div>
  )
}
