import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { getSimulation } from '../../queries'

export const metadata: Metadata = { title: 'Solicitação recebida' }

type Props = { params: Promise<{ id: string }> }

export default async function AgradecimentoPage({ params }: Props) {
  const { id } = await params
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const simulation = await getSimulation(id, tenantId)
  if (!simulation) notFound()

  const productName = (simulation.products as { name: string } | null)?.name ?? 'Crédito'

  return (
    <div className="min-h-[calc(100vh-78px)] bg-surface py-12 text-surface-foreground">
      <div className="mx-auto max-w-2xl px-8">
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-10 text-center max-sm:p-6">
          <div className="mb-6 flex justify-center">
            <CheckCircle className="h-14 w-14 text-green-500" />
          </div>
          <span className="inline-flex items-center rounded-full bg-[oklch(0.96_0.03_85)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[oklch(0.48_0.07_50)]">
            {productName}
          </span>
          <h2 className="mb-3 mt-5 text-[26px] font-bold leading-tight tracking-tight text-surface-foreground">
            Recebemos seu interesse!
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-surface-foreground/60">
            Olá, <strong className="text-surface-foreground">{simulation.client_name}</strong>!
            Um de nossos consultores vai entrar em contato pelo seu WhatsApp em breve para
            dar continuidade à sua solicitação de <strong>{productName}</strong>.
          </p>
          <Link
            href="/"
            className="inline-flex items-center rounded-2xl bg-background px-6 py-3.5 text-[15px] font-semibold text-primary transition-opacity hover:opacity-90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}
