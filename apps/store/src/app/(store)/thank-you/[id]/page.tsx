import type { Metadata } from 'next'
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

  const productName = (simulation?.products as { name: string } | null)?.name ?? 'Crédito'
  const clientName = simulation?.client_name

  return (
    <div className="min-h-[calc(100vh-78px)] bg-surface py-12 text-surface-foreground">
      <div className="mx-auto max-w-2xl px-8">
        <div className="rounded-2xl border border-foreground/[0.06] bg-white p-10 text-center max-sm:p-6">
          <div className="mb-6 flex justify-center">
            <CheckCircle className="h-14 w-14 text-success" />
          </div>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-primary-foreground">
            {productName}
          </span>
          <h2 className="mb-3 mt-5 text-2xl font-bold leading-tight tracking-tight text-surface-foreground">
            Recebemos seu interesse!
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-surface-foreground/60">
            {clientName ? (
              <>
                Olá, <strong className="text-surface-foreground">{clientName}</strong>!{' '}
              </>
            ) : null}
            Um de nossos consultores vai entrar em contato pelo seu WhatsApp em breve para
            dar continuidade à sua solicitação de <strong>{productName}</strong>.
          </p>
          <Link
            href="/"
            className="inline-flex items-center rounded-2xl bg-background px-6 py-3.5 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}
