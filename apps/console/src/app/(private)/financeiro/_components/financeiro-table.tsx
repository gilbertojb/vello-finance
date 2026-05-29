'use client'

import { useState } from 'react'
import type { CommissionRow } from '../queries'

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const pct = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 2 }).format(v / 100)

const dateStr = (v: string) => {
  const d = new Date(v)
  return d.toLocaleDateString('pt-BR')
}

const PAGE_SIZE = 20

interface StatusPillProps {
  status: CommissionRow['status']
}

function StatusPill({ status }: StatusPillProps) {
  if (status === 'pago') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 px-2.5 py-0.5 text-xs font-medium text-success">
        <span className="size-1.5 rounded-full bg-success" />
        Pago
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 px-2.5 py-0.5 text-xs font-medium text-warning">
      <span className="size-1.5 rounded-full bg-warning" />
      A receber
    </span>
  )
}

interface Props {
  rows: CommissionRow[]
}

export function FinanceiroTable({ rows }: Props) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-foreground/60">Cliente</th>
              <th className="px-4 py-3 text-left font-medium text-foreground/60">Produto</th>
              <th className="px-4 py-3 text-right font-medium text-foreground/60">Valor financiado</th>
              <th className="px-4 py-3 text-right font-medium text-foreground/60">% Comissão</th>
              <th className="px-4 py-3 text-right font-medium text-foreground/60">Valor comissão</th>
              <th className="px-4 py-3 text-left font-medium text-foreground/60">Status</th>
              <th className="px-4 py-3 text-left font-medium text-foreground/60">Data</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-foreground/40">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              slice.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{row.clientName}</td>
                  <td className="px-4 py-3 text-foreground/60">{row.product}</td>
                  <td className="px-4 py-3 text-right">{brl(row.valorFinanciado)}</td>
                  <td className="px-4 py-3 text-right">{pct(row.comissaoPct)}</td>
                  <td className="px-4 py-3 text-right font-medium">{brl(row.comissaoValor)}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-foreground/60">{dateStr(row.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-foreground/60">
          <span>
            {rows.length} registros · página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
