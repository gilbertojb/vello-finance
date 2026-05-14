import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Zap, Lock, Shield } from 'lucide-react'
import { generateTermOptions } from '@/lib/utils/simulator'
import { getTenantProduct } from '../../queries'
import { SimulatorPanel } from './_components/simulator-panel'

const TYPE_LABELS: Record<string, string> = {
  fgts: 'FGTS',
  consignado_publico: 'Consignado Público',
  consignado_privado: 'Consignado Privado',
  home_equity: 'Home Equity',
  auto_equity: 'Auto Equity',
  outros: 'Outros',
}

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ amount?: string; term?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const tp = await getTenantProduct(id, tenantId)
  return { title: tp?.products?.name ?? 'Simulador' }
}

export default async function SimulatorPage({ params, searchParams }: Props) {
  const { id } = await params
  const { amount: amountParam, term: termParam } = await searchParams
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const tp = await getTenantProduct(id, tenantId)
  if (!tp || !tp.products) notFound()

  const { products: p } = tp
  const minAmount = p.min_amount ?? 1000
  const maxAmount = p.max_amount ?? 100000
  const minTerm = p.min_term_months ?? 12
  const maxTerm = p.max_term_months ?? 60
  const minRate = p.min_rate_monthly ?? 0
  const termOptions = generateTermOptions(minTerm, maxTerm)
  const initialAmount = Math.min(maxAmount, Math.max(minAmount, Number(amountParam) || minAmount))
  const initialTerm = termOptions.includes(Number(termParam)) ? Number(termParam) : termOptions[0]
  const typeSlug = (p.product_type as { slug: string } | null)?.slug ?? 'outros'
  const categoryLabel = TYPE_LABELS[typeSlug] ?? 'Crédito'

  return (
    <div className="grid min-h-[calc(100vh-78px)] grid-cols-[5fr_7fr] max-lg:grid-cols-1">
      {/* Esquerda dark */}
      <div className="flex flex-col justify-between bg-background px-14 py-16 max-lg:px-8 max-lg:py-10">
        <div>
          <Link href="/#produtos" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar aos produtos
          </Link>
          <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/28 bg-primary/[0.04] px-3.5 py-2 text-[11px] font-medium uppercase tracking-[.22em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {categoryLabel} · {p.name}
          </span>
          <h2 className="mb-[22px] mt-6 text-[56px] font-light leading-none tracking-tight text-foreground max-lg:text-5xl max-sm:text-4xl">
            Simule seu<br />
            <em className="font-serif not-italic font-normal text-primary">
              {p.name.split(' ').slice(-1)[0]?.toLowerCase() ?? 'crédito'}.
            </em>
          </h2>
          <p className="max-w-[380px] text-[15px] leading-relaxed text-foreground/70">
            {p.description ?? 'Ajuste valor e prazo para ver sua parcela em tempo real. Tudo transparente.'}
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-[18px]">
          {[
            { Icon: Zap, title: 'Aprovação em minutos', desc: 'Engine de crédito digital com resposta rápida.' },
            { Icon: Lock, title: 'Taxa garantida por 30 dias', desc: 'Simulou hoje? A taxa fica garantida durante a contratação.' },
            { Icon: Shield, title: 'Sem afetar seu score', desc: 'Consulta soft, sem registro em birôs de crédito.' },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="flex gap-3.5">
              <div className="grid h-[38px] w-[38px] flex-shrink-0 place-items-center rounded-[10px] bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{title}</div>
                <div className="text-xs leading-relaxed text-foreground/55">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Direita surface */}
      <div className="bg-surface px-14 py-16 text-surface-foreground max-lg:px-8 max-lg:py-10">
        <div className="mb-9 flex items-center justify-between">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-[oklch(0.48_0.07_50)/30%] bg-[oklch(0.48_0.07_50)/4%] px-3.5 py-2 text-[11px] font-medium uppercase tracking-[.22em] text-[oklch(0.48_0.07_50)]">
            <span className="h-1.5 w-1.5 rounded-full bg-green-700" /> Simulação
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-7 rounded-full bg-primary" />
            <span className="h-1 w-7 rounded-full bg-surface-foreground/12" />
            <span className="h-1 w-7 rounded-full bg-surface-foreground/12" />
            <span className="ml-2 text-[11px] uppercase tracking-[.18em] text-surface-foreground/50">Etapa 1 de 3</span>
          </div>
        </div>

        <h2 className="mb-1.5 text-[38px] font-semibold leading-none tracking-tight">Configure sua linha</h2>
        <p className="mb-9 font-serif italic text-[15px] text-surface-foreground/55">
          Os valores se atualizam automaticamente — você está no controle.
        </p>

        <SimulatorPanel
          tenantProductId={id}
          minAmount={minAmount}
          maxAmount={maxAmount}
          termOptions={termOptions}
          minRate={minRate}
          initialAmount={initialAmount}
          initialTerm={initialTerm}
        />
      </div>
    </div>
  )
}
