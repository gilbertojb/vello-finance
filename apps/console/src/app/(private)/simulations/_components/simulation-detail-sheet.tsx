'use client'

import { Mail, Phone } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import type { SimulationRow } from '../queries'

// ─── Utilitários ─────────────────────────────────────────────────────────────

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function simId(id: string): string {
  return 'SIM-' + id.replace(/-/g, '').slice(-8).toUpperCase()
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `há ${hrs}h`
  return `há ${Math.floor(hrs / 24)}d`
}

function maskCPF(cpf: string | null): string {
  if (!cpf) return '—'
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11) return cpf
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`
}

function calcAge(birthdate: string | null): string {
  if (!birthdate) return '—'
  const birth = new Date(birthdate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return `${age} anos`
}

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return phone
}

function calcCET(rate: number | null): string {
  if (!rate) return '—'
  const cet = (Math.pow(1 + rate / 100, 12) - 1) * 100
  return `${cet.toFixed(1)}%`
}

function getProductName(products: SimulationRow['products']): string {
  if (!products) return '—'
  return Array.isArray(products)
    ? (products[0]?.name ?? '—')
    : (products as { name: string }).name
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Props {
  simulation: SimulationRow | null
  onClose: () => void
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function SimulationDetailSheet({ simulation, onClose }: Props) {
  return (
    <Sheet open={simulation !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
        {simulation && <SheetBody simulation={simulation} />}
      </SheetContent>
    </Sheet>
  )
}

// ─── Corpo do sheet ───────────────────────────────────────────────────────────

function SheetBody({ simulation }: { simulation: SimulationRow }) {
  const sim = simulation as SimulationRow & {
    client_email?: string | null
    client_cpf?: string | null
    client_birthdate?: string | null
    client_city?: string | null
    client_income?: number | null
  }

  return (
    <div className="flex flex-col gap-6 pt-2">
      {/* Header */}
      <SheetHeader className="pb-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span className="font-mono">{simId(sim.id)}</span>
          <span>·</span>
          <span>{relativeTime(sim.created_at)}</span>
        </div>
        <SheetTitle className="text-xl">{sim.client_name}</SheetTitle>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <Badge
            variant={sim.status === 'pre_qualificado' ? 'default' : 'secondary'}
            className={
              sim.status === 'pre_qualificado'
                ? 'border-emerald-500/20 bg-emerald-500/15 text-emerald-600'
                : ''
            }
          >
            {sim.status === 'pre_qualificado' ? 'Pré-qualificado' : 'Não qualificado'}
          </Badge>
          <Badge variant="outline">{getProductName(sim.products)}</Badge>
        </div>
      </SheetHeader>

      <Separator />

      {/* Dados Pessoais */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Dados Pessoais
        </p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <dt className="text-muted-foreground">CPF</dt>
          <dd className="font-mono text-right">{maskCPF(sim.client_cpf ?? null)}</dd>

          <dt className="text-muted-foreground">Idade</dt>
          <dd className="text-right">{calcAge(sim.client_birthdate ?? null)}</dd>

          <dt className="text-muted-foreground">E-mail</dt>
          <dd className="text-right truncate">{sim.client_email ?? '—'}</dd>

          <dt className="text-muted-foreground">Telefone</dt>
          <dd className="font-mono text-right">{formatPhone(sim.client_phone)}</dd>

          <dt className="text-muted-foreground">Cidade</dt>
          <dd className="text-right">{sim.client_city ?? '—'}</dd>

          <dt className="text-muted-foreground">Renda mensal</dt>
          <dd className="font-mono text-right">
            {sim.client_income != null ? brl(Number(sim.client_income)) : '—'}
          </dd>
        </dl>
      </div>

      <Separator />

      {/* Condições Simuladas */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Condições Simuladas
        </p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <dt className="text-muted-foreground">Valor solicitado</dt>
          <dd className="font-mono text-right">{brl(Number(sim.desired_amount))}</dd>

          <dt className="text-muted-foreground">Parcela mensal</dt>
          <dd className="font-mono text-right">
            {sim.estimated_payment ? brl(Number(sim.estimated_payment)) : '—'}
          </dd>

          <dt className="text-muted-foreground">Prazo</dt>
          <dd className="text-right">{sim.desired_term_months} meses</dd>

          <dt className="text-muted-foreground">Taxa</dt>
          <dd className="font-mono text-right">
            {sim.estimated_rate
              ? `${Number(sim.estimated_rate).toFixed(2)}% a.m.`
              : '—'}
          </dd>

          <dt className="text-muted-foreground">CET anual</dt>
          <dd className="font-mono text-right">
            {calcCET(sim.estimated_rate ? Number(sim.estimated_rate) : null)}
          </dd>

          <dt className="text-muted-foreground">Total a pagar</dt>
          <dd className="font-mono text-right">
            {sim.estimated_payment
              ? brl(Number(sim.estimated_payment) * sim.desired_term_months)
              : '—'}
          </dd>
        </dl>
      </div>

      {/* Rodapé */}
      <div className="mt-auto pt-4 flex gap-2">
        <Button variant="outline" size="sm" asChild className="flex-1">
          <a href={`tel:${sim.client_phone}`}>
            <Phone className="size-4 mr-2" />
            Ligar
          </a>
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={!sim.client_email}
          className="flex-1"
          asChild={!!sim.client_email}
        >
          {sim.client_email ? (
            <a href={`mailto:${sim.client_email}`}>
              <Mail className="size-4 mr-2" />
              E-mail
            </a>
          ) : (
            <span>
              <Mail className="size-4 mr-2" />
              E-mail
            </span>
          )}
        </Button>

        <Button size="sm" disabled className="flex-1">
          Converter em proposta →
        </Button>
      </div>
    </div>
  )
}
