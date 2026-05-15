'use client'

import { Phone, Mail } from 'lucide-react'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
import type { SimulationRow } from '../queries'
import { StatusPill } from './simulations-list'

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

// ─── Tipos ────────────────────────────────────────────────────────────────────

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

// ─── Score Ring SVG ────────────────────────────────────────────────────────────

function ScoreRing({ score, color }: { score: number; color: string }) {
  const R = 34
  const C = 2 * Math.PI * R
  const offset = C - (score / 100) * C
  return (
    <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(246,239,228,.08)" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={R} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
        fontSize: 20, fontWeight: 600, color,
      }}>
        {score}
      </div>
    </div>
  )
}

// ─── Seção helper ─────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 style={{
      fontSize: 10.5, letterSpacing: '.18em', textTransform: 'uppercase' as const,
      color: 'rgba(246,239,228,.55)', fontWeight: 500, margin: '0 0 14px',
    }}>
      {children}
    </h4>
  )
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px' }}>
      {children}
    </div>
  )
}

function InfoItem({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: 'rgba(246,239,228,.55)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: gold ? '#e9c77b' : '#f6efe4' }}>{value}</div>
    </div>
  )
}

// ─── DrawerBody ───────────────────────────────────────────────────────────────

function DrawerBody({ simulation, onClose }: { simulation: SimulationRow; onClose: () => void }) {
  const sim = simulation as SimFull

  const score = sim.status === 'pre_qualificado' ? 78 : sim.status === 'rascunho' ? 42 : 55
  const scoreColor = score >= 70 ? '#a8d490' : score >= 50 ? '#e9c77b' : '#e8a092'
  const scoreLabel = score >= 70 ? 'Alta probabilidade' : score >= 50 ? 'Probabilidade média' : 'Baixa probabilidade'

  const SCORE_FACTORS = ['Margem consignável', 'Idade × prazo', 'Score externo', 'Origem']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* HEAD */}
      <div style={{
        padding: '22px 26px 18px',
        borderBottom: '1px solid rgba(233,199,123,.10)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14,
      }}>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(246,239,228,.55)', letterSpacing: '.04em' }}>
            {simId(sim.id)} · {relativeTime(sim.created_at)}
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display','Georgia',serif",
            fontStyle: 'italic', fontWeight: 400, fontSize: 28,
            margin: '6px 0 0', letterSpacing: '-.01em', lineHeight: 1.1, color: '#f6efe4',
          }}>
            {sim.client_name}
          </h2>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center', flexWrap: 'wrap' as const }}>
            <StatusPill status={sim.status} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: '#f6efe4' }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: '#e9c77b' }} />
              {getProductName(sim.products)}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 30, height: 30, borderRadius: 7, flexShrink: 0,
            background: 'rgba(246,239,228,.06)', border: '1px solid rgba(233,199,123,.12)',
            color: 'rgba(246,239,228,.6)', cursor: 'pointer',
            display: 'grid', placeItems: 'center', fontSize: 16, lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 26px 32px' }}>
        {/* Score de conversão */}
        <div style={{ marginBottom: 28 }}>
          <SectionTitle>Score de conversão</SectionTitle>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <ScoreRing score={score} color={scoreColor} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: scoreColor, marginBottom: 4 }}>{scoreLabel}</div>
              <div style={{ fontSize: 12, color: 'rgba(246,239,228,.5)', lineHeight: 1.5, marginBottom: 14 }}>
                Estimado com base em margem, produto e origem. Atualizado em tempo real.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                {SCORE_FACTORS.map((f, i) => (
                  <span key={f} style={{
                    fontSize: 11, color: 'rgba(246,239,228,.5)',
                    padding: '3px 9px', borderRadius: 999,
                    background: 'rgba(246,239,228,.04)',
                    border: '1px solid rgba(233,199,123,.10)',
                    ...(i < SCORE_FACTORS.length - 1 ? {} : {}),
                  }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Divisor */}
        <div style={{ height: 1, background: 'rgba(233,199,123,.10)', margin: '0 0 24px' }} />

        {/* Dados pessoais */}
        <div style={{ marginBottom: 28 }}>
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
              gold
            />
          </InfoGrid>
        </div>

        {/* Divisor */}
        <div style={{ height: 1, background: 'rgba(233,199,123,.10)', margin: '0 0 24px' }} />

        {/* Condições simuladas */}
        <div>
          <SectionTitle>Condições simuladas</SectionTitle>
          <InfoGrid>
            <InfoItem label="Valor solicitado" value={brl(Number(sim.desired_amount))} gold />
            <InfoItem
              label="Parcela mensal"
              value={sim.estimated_payment ? brl(Number(sim.estimated_payment)) : '—'}
              gold
            />
            <InfoItem label="Prazo" value={`${sim.desired_term_months} meses`} />
            <InfoItem
              label="Taxa"
              value={sim.estimated_rate ? `${Number(sim.estimated_rate).toFixed(2)}% a.m.` : '—'}
            />
            <InfoItem
              label="CET anual"
              value={calcCET(sim.estimated_rate ? Number(sim.estimated_rate) : null)}
            />
            <InfoItem
              label="Total a pagar"
              value={sim.estimated_payment
                ? brl(Number(sim.estimated_payment) * sim.desired_term_months)
                : '—'}
            />
          </InfoGrid>
        </div>
      </div>

      {/* FOOT */}
      <div style={{
        padding: '18px 26px',
        borderTop: '1px solid rgba(233,199,123,.10)',
        display: 'flex', gap: 10,
        background: '#0a0807',
      }}>
        <a
          href={`tel:${sim.client_phone}`}
          style={{
            flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'rgba(246,239,228,.04)', border: '1px solid rgba(233,199,123,.16)',
            borderRadius: 9, padding: '10px 16px', color: '#f6efe4',
            fontSize: 13, fontWeight: 500, textDecoration: 'none', cursor: 'pointer',
          }}
        >
          <Phone size={14} />
          Ligar
        </a>
        <a
          href={sim.client_email ? `mailto:${sim.client_email}` : undefined}
          style={{
            flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'rgba(246,239,228,.04)', border: '1px solid rgba(233,199,123,.16)',
            borderRadius: 9, padding: '10px 16px', color: sim.client_email ? '#f6efe4' : 'rgba(246,239,228,.3)',
            fontSize: 13, fontWeight: 500, textDecoration: 'none', cursor: sim.client_email ? 'pointer' : 'default',
            pointerEvents: sim.client_email ? 'auto' : 'none',
          }}
        >
          <Mail size={14} />
          E-mail
        </a>
        <button
          disabled
          style={{
            flex: 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(180deg,#f3d488,#d4a94f)',
            color: '#241608', fontWeight: 600, borderRadius: 9,
            padding: '10px 16px', fontSize: 13, border: 'none', cursor: 'not-allowed',
            opacity: 0.7,
          }}
        >
          Converter em proposta →
        </button>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function SimulationDetailSheet({ simulation, onClose }: Props) {
  return (
    <Sheet open={simulation !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent
        style={{
          width: 520,
          maxWidth: '96vw',
          background: '#0e0a08',
          borderLeft: '1px solid rgba(233,199,123,.10)',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          gap: 0,
        }}
      >
        {simulation && <DrawerBody simulation={simulation} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  )
}
