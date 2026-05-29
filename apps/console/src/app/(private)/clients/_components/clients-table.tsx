'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { LeadRow } from '../queries'
import { StagePill } from './stage-pill'

function brl(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

interface Props {
  leads: LeadRow[]
}

const PAGE_SIZE = 20

export function ClientsTable({ leads }: Props) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(leads.length / PAGE_SIZE))
  const pageData = leads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card">
      <table className="w-full">
        <thead>
          <tr className="border-b border-primary/10 bg-foreground/2">
            {['Cliente', 'Produto', 'Estágio', 'Valor solicitado', 'Origem', 'Data'].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-foreground/40"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageData.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-sm text-foreground/38">
                Nenhum lead encontrado.
              </td>
            </tr>
          )}
          {pageData.map((lead, i) => {
            const isLast = i === pageData.length - 1
            return (
              <tr key={lead.id} className="hover:bg-foreground/2">
                <td className={cn('p-4 font-medium', !isLast && 'border-b border-primary/8')}>
                  <span className="text-sm">{lead.clientName}</span>
                </td>
                <td className={cn('p-4', !isLast && 'border-b border-primary/8')}>
                  <span className="text-sm text-foreground/70">{lead.product}</span>
                </td>
                <td className={cn('p-4', !isLast && 'border-b border-primary/8')}>
                  <StagePill stage={lead.stage} />
                </td>
                <td className={cn('p-4', !isLast && 'border-b border-primary/8')}>
                  <span className="text-sm font-medium">{brl(lead.desiredAmount)}</span>
                </td>
                <td className={cn('p-4', !isLast && 'border-b border-primary/8')}>
                  <span className="text-xs text-foreground/55">{lead.origin}</span>
                </td>
                <td className={cn('p-4', !isLast && 'border-b border-primary/8')}>
                  <span className="text-xs text-foreground/55">{formatDate(lead.createdAt)}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t border-primary/10 bg-foreground/2 px-4 py-4 text-xs text-foreground/55">
        <span>
          Mostrando{' '}
          <span className="font-medium text-foreground">{pageData.length}</span> de{' '}
          <span className="font-medium text-foreground">{leads.length}</span> leads
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="grid size-8 place-items-center rounded-lg text-xs font-medium disabled:opacity-30"
          >
            ←
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = i + 1
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={cn(
                  'grid size-8 place-items-center rounded-lg text-xs',
                  p === page
                    ? 'bg-primary font-semibold text-primary-foreground'
                    : 'font-medium text-foreground/55',
                )}
              >
                {p}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="grid size-8 place-items-center rounded-lg text-xs font-medium disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
