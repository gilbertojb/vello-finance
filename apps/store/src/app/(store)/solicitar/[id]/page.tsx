import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTenantProduct } from '../../queries'
import { createProposal } from './actions'
import { StepIndicator } from './_components/step-indicator'
import { StepOneForm } from './_components/step-one-form'
import { StepTwoForm } from './_components/step-two-form'
import { formatCurrency } from '@/lib/utils/simulator'

export const metadata: Metadata = { title: 'Solicitar crédito' }

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ step?: string; purpose?: string; amount?: string; term?: string; name?: string; email?: string }>
}

export default async function RequestPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = await searchParams
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const tp = await getTenantProduct(id, tenantId)
  if (!tp || !tp.products) notFound()

  const step = sp.step === '2' ? 2 : 1
  const minRate = tp.products.min_rate_monthly ?? 0
  const initialAmount = Number(sp.amount) || tp.products.min_amount || 1000
  const initialTerm = Number(sp.term) || tp.products.min_term_months || 12
  const boundAction = createProposal.bind(null, id, tp.products.id)
  const step1Data = {
    purpose: sp.purpose ?? '',
    amount: sp.amount ?? String(initialAmount),
    term: sp.term ?? String(initialTerm),
    name: sp.name ?? '',
    email: sp.email ?? '',
  }
  const rateStr = minRate.toFixed(2).replace('.', ',')
  const categorySlug = (tp.products.product_type as { slug: string } | null)?.slug ?? ''
  const TYPE_LABELS: Record<string, string> = {
    fgts: 'FGTS',
    consignado_publico: 'Consignado Público',
    consignado_privado: 'Consignado Privado',
    home_equity: 'Home Equity',
    auto_equity: 'Auto Equity',
    outros: 'Outros',
  }
  const categoryName = TYPE_LABELS[categorySlug] ?? 'Produto'

  return (
    <div className="min-h-[calc(100vh-78px)] bg-surface py-12 text-surface-foreground">
      <div className="mx-auto max-w-7xl px-8">
        <Link href={`/produto/${id}`} className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-[oklch(0.48_0.07_50)] transition-colors hover:text-surface-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar à simulação
        </Link>

        <div className="mb-8 flex items-end justify-between max-sm:flex-col max-sm:items-start max-sm:gap-4">
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-[oklch(0.48_0.07_50)/20%] bg-[oklch(0.48_0.07_50)/4%] px-3.5 py-2 text-[11px] font-medium uppercase tracking-[.22em] text-[oklch(0.48_0.07_50)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.48_0.07_50)]" />
              Etapa {step + 1} de 3 · Solicitação
            </span>
            <h2 className="mt-3.5 text-[54px] font-light leading-none tracking-tight max-sm:text-4xl">
              Quase lá<em className="font-serif not-italic font-normal text-[oklch(0.48_0.07_50)]">.</em>
            </h2>
          </div>
          <StepIndicator currentStep={step as 1 | 2} />
        </div>

        <div className="grid grid-cols-[1fr_380px] gap-12 max-lg:grid-cols-1">
          {/* Card principal */}
          <div className="rounded-[22px] border border-black/[0.06] bg-white p-12 max-sm:p-6">
            {step === 1 ? (
              <StepOneForm tenantProductId={id} minRate={minRate} initialAmount={initialAmount} initialTerm={initialTerm} />
            ) : (
              <StepTwoForm tenantProductId={id} action={boundAction} step1Data={step1Data} />
            )}
          </div>

          {/* Aside sticky */}
          <aside className="flex flex-col gap-3.5 max-lg:order-first">
            <div className="relative overflow-hidden rounded-[20px] bg-card p-7 text-foreground">
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-[200px] w-[200px] rounded-full"
                style={{ background: 'radial-gradient(circle, oklch(0.83 0.10 85 / 0.16), transparent 70%)' }}
                aria-hidden="true"
              />
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/28 bg-primary/[0.06] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[.18em] text-primary">
                <span className="h-1 w-1 rounded-full bg-green-400" /> Resumo
              </span>
              <h4 className="mt-[18px] text-[22px] font-semibold leading-tight tracking-tight">{tp.products.name}</h4>
              <p className="mb-6 mt-1 text-sm text-foreground/60">{categoryName} · taxa a partir de {rateStr}%</p>
              {[
                { k: 'Valor solicitado', v: formatCurrency(initialAmount) },
                { k: 'Prazo', v: `${initialTerm} meses` },
                { k: 'Taxa a partir de', v: `${rateStr}% a.m.` },
              ].map(({ k, v }) => (
                <div key={k} className="flex justify-between border-t border-primary/12 py-3 text-sm">
                  <span className="text-foreground/55">{k}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </div>

            {[
              { title: 'Precisa de ajuda?', desc: 'Nossa equipe atende de seg a sáb, 8h–20h.', link: 'Falar agora →' },
              { title: 'Conexão protegida', desc: 'Criptografia AES-256. Seus dados protegidos.' },
            ].map(({ title, desc, link }) => (
              <div key={title} className="flex gap-3.5 rounded-[18px] border border-black/[0.06] bg-white p-[22px]">
                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[10px] bg-surface text-[oklch(0.25_0.04_45)]">
                  {link ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-surface-foreground">{title}</div>
                  <div className="mt-1 text-xs leading-relaxed text-surface-foreground/55">{desc}</div>
                  {link && <a href="#" className="mt-2 inline-block text-xs font-semibold text-[oklch(0.25_0.04_45)]">{link}</a>}
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  )
}
