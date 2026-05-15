'use client'

import { Mail, Phone } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import type { SimulationRow } from '../queries'
import { StatusPill } from './simulations-list'

// ── Utilitários ───────────────────────────────────────────────────────────────

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

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Props {
  simulation: SimulationRow | null
  onClose: () => void
}

type SimFull = SimulationRow & {
  client_email?: string | null
  client_cpf?: string | null
  client_birthdate?: string | null
  client_city?: string | null
  client_income?: number | null
}

// ── Score Ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, color }: { score: number; color: string }) {
  const R = 34
  const C = 2 * Math.PI * R
  const offset = C - (score / 100) * C
  return (
    <div className="relative size-20 shrink-0">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={R}
          fill="none"
          stroke="color-mix(in oklch, var(--foreground) 8%, transparent)"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
      </svg>
      <div
        className="absolute inset-0 grid place-items-center text-[20px] font-semibold"
        style={{ color }}
      >
        {score}
      </div>
    </div>
  )
}

// ── Primitivos do drawer ──────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-3.5 text-[10.5px] font-medium uppercase tracking-[.18em] text-foreground/55">
      {children}
    </h4>
  )
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-[18px] gap-y-3.5">{children}</div>
  )
}

function InfoItem({
  label,
  value,
  primary,
}: {
  label: string
  value: string
  primary?: boolean
}) {
  return (
    <div>
      <div className="mb-0.5 text-[11.5px] text-foreground/55">{label}</div>
      <div className={primary ? 'text-[14px] font-medium text-primary' : 'text-[14px] font-medium text-foreground'}>
        {value}
      </div>
    </div>
  )
}

// ── DrawerBody ────────────────────────────────────────────────────────────────

function DrawerBody({
  simulation,
  onClose,
}: {
  simulation: SimulationRow
  onClose: () => void
}) {
  const sim = simulation as SimFull
  const score = sim.status === 'pre_qualificado' ? 78 : sim.status === 'rascunho' ? 42 : 55
  const scoreColor =
    score >= 70 ? 'var(--success)' : score >= 50 ? 'var(--primary)' : 'var(--destructive)'
  const scoreLabel =
    score >= 70 ? 'Alta probabilidade' : score >= 50 ? 'Probabilidade média' : 'Baixa probabilidade'

  const SCORE_FACTORS = ['Margem consignável', 'Idade × prazo', 'Score externo', 'Origem']

  return (
    <div className="flex h-full flex-col">
      {/* HEAD */}
      <div className="flex items-start justify-between gap-3.5 border-b border-primary/10 px-[26px] pb-[18px] pt-[22px]">
        <div>
          <div className="font-mono text-[11px] tracking-[.04em] text-foreground/55">
            {simId(sim.id)} · {relativeTime(sim.created_at)}
          </div>
          <h2 className="mb-0 mt-1.5 text-[28px] font-semibold leading-tight tracking-[-0.01em] text-foreground">
            {sim.client_name}
          </h2>
          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            <StatusPill status={sim.status} />
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
              <span className="size-[7px] rounded-sm" style={{ background: 'var(--primary)' }} />
              {getProductName(sim.products)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid size-[30px] shrink-0 cursor-pointer place-items-center rounded-[7px] border border-primary/12 bg-foreground/6 text-[16px] leading-none text-foreground/60"
        >
          ✕
        </button>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto px-[26px] pb-8 pt-6">
        {/* Score de conversão */}
        <div className="mb-7">
          <SectionTitle>Score de conversão</SectionTitle>
          <div className="flex items-start gap-5">
            <ScoreRing score={score} color={scoreColor} />
            <div className="flex-1">
              <div className="mb-1 text-[14px] font-semibold" style={{ color: scoreColor }}>
                {scoreLabel}
              </div>
              <div className="mb-3.5 text-xs leading-relaxed text-foreground/50">
                Estimado com base em margem, produto e origem. Atualizado em tempo real.
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SCORE_FACTORS.map((f) => (
                  <span
                    key={f}
                    className="rounded-full border border-primary/10 bg-foreground/4 px-[9px] py-[3px] text-[11px] text-foreground/50"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 h-px bg-primary/10" />

        {/* Dados pessoais */}
        <div className="mb-7">
          <SectionTitle>Dados pessoais</SectionTitle>
          <InfoGrid>
            <InfoItem label="CPF" value={maskCPF(sim.client_cpf ?? null)} />
            <InfoItem label="Idade" value={calcAge(sim.client_birthdate ?? null)} />
            <InfoItem label="E-mail" value={sim.client_email ?? '—'} />
            <InfoItem label="Telefone" value={formatPhone(sim.client_phone)} />
            <InfoItem label="Cidade" value={sim.client_city ?? '—'} />
            <InfoItem
              label="Renda mensal"
              value={sim.client_income != null ? brl(Number(sim.client_income)) : '—'}
              primary
            />
          </InfoGrid>
        </div>

        <div className="mb-6 h-px bg-primary/10" />

        {/* Condições simuladas */}
        <div>
          <SectionTitle>Condições simuladas</SectionTitle>
          <InfoGrid>
            <InfoItem label="Valor solicitado" value={brl(Number(sim.desired_amount))} primary />
            <InfoItem
              label="Parcela mensal"
              value={sim.estimated_payment ? brl(Number(sim.estimated_payment)) : '—'}
              primary
            />
            <InfoItem label="Prazo" value={`${sim.desired_term_months} meses`} />
            <InfoItem
              label="Taxa"
              value={
                sim.estimated_rate ? `${Number(sim.estimated_rate).toFixed(2)}% a.m.` : '—'
              }
            />
            <InfoItem
              label="CET anual"
              value={calcCET(sim.estimated_rate ? Number(sim.estimated_rate) : null)}
            />
            <InfoItem
              label="Total a pagar"
              value={
                sim.estimated_payment
                  ? brl(Number(sim.estimated_payment) * sim.desired_term_months)
                  : '—'
              }
            />
          </InfoGrid>
        </div>
      </div>

      {/* FOOT */}
      <div className="flex gap-2.5 border-t border-primary/10 bg-card px-[26px] py-[18px]">
        <a
          href={`tel:${sim.client_phone}`}
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[9px] border border-primary/16 bg-foreground/4 px-4 py-[10px] text-[13px] font-medium text-foreground no-underline"
        >
          <Phone size={14} />
          Ligar
        </a>
        <a
          href={sim.client_email ? `mailto:${sim.client_email}` : undefined}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-[9px] border border-primary/16 bg-foreground/4 px-4 py-[10px] text-[13px] font-medium no-underline"
          style={{
            color: sim.client_email ? 'var(--foreground)' : 'color-mix(in oklch, var(--foreground) 30%, transparent)',
            pointerEvents: sim.client_email ? 'auto' : 'none',
            cursor: sim.client_email ? 'pointer' : 'default',
          }}
        >
          <Mail size={14} />
          E-mail
        </a>
        <button
          type="button"
          disabled
          className="inline-flex flex-[2] cursor-not-allowed items-center justify-center rounded-[9px] border-none bg-primary px-4 py-[10px] text-[13px] font-semibold text-primary-foreground opacity-70"
        >
          Converter em proposta →
        </button>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function SimulationDetailSheet({ simulation, onClose }: Props) {
  return (
    <Sheet open={simulation !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent
        className="flex flex-col gap-0 border-l border-primary/10 bg-card p-0"
        style={{ width: 520, maxWidth: '96vw' }}
      >
        {simulation && <DrawerBody simulation={simulation} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  )
}
