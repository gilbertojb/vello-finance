import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/simulator'
import { getProposalConfirmation } from '../../queries'

export const metadata: Metadata = { title: 'Solicitação recebida' }

type Props = { params: Promise<{ id: string }> }

export default async function ConfirmationPage({ params }: Props) {
  const { id } = await params
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const proposal = await getProposalConfirmation(id, tenantId)
  if (!proposal) notFound()

  const protocol = proposal.id.replace(/-/g, '').slice(0, 8).toUpperCase()
  // biome-ignore lint/suspicious/noExplicitAny: supabase join type
  const productName = (proposal.products as any)?.name ?? ''

  return (
    <div className="relative grid min-h-[calc(100vh-78px)] place-items-center overflow-hidden bg-background px-8 py-16">
      <div
        className="pointer-events-none absolute -right-[300px] -top-[200px] h-[800px] w-[800px] rounded-full"
        style={{ background: 'radial-gradient(circle, oklch(0.83 0.10 85 / 0.08), transparent 60%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[680px] text-center">
        <div className="mx-auto mb-9 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-b from-primary to-primary/70 shadow-[0_30px_80px_-20px_oklch(0.83_0.10_85/40%)] text-primary-foreground">
          <Check className="h-10 w-10" strokeWidth={2.5} />
        </div>

        <h1 className="mb-5 text-[60px] font-light leading-none tracking-tight text-foreground max-sm:text-[38px]">
          Solicitação<br />
          <em className="font-serif not-italic font-normal text-primary">recebida.</em>
        </h1>

        <p className="mx-auto mb-10 max-w-[480px] text-[17px] leading-relaxed text-foreground/70">
          Recebemos sua solicitação para{' '}
          <strong className="text-primary">{productName}</strong>.
          Nossa equipe entrará em contato pelo e-mail cadastrado em breve.
        </p>

        <div className="mb-9 grid grid-cols-3 gap-3.5 rounded-[18px] border border-primary/12 bg-foreground/[0.04] p-6 max-sm:grid-cols-1">
          {[
            { k: 'Protocolo', v: `#${protocol}` },
            { k: 'Valor solicitado', v: formatCurrency(proposal.desired_amount) },
            { k: 'Prazo', v: `${proposal.desired_term_months} meses` },
          ].map(({ k, v }) => (
            <div key={k}>
              <div className="text-[10px] font-medium uppercase tracking-[.2em] text-foreground/50">{k}</div>
              <div className="mt-1 text-lg font-semibold tracking-tight text-primary">{v}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-3.5">
          <Link
            href="/"
            className="rounded-full bg-gradient-to-b from-primary to-primary/80 px-[26px] py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-10px_oklch(0.83_0.10_85/50%)] transition-all hover:brightness-110"
          >
            Voltar ao início
          </Link>
          <Link
            href="/"
            className="rounded-full border border-foreground/18 px-[26px] py-3.5 text-sm font-medium text-foreground transition-all hover:border-primary hover:text-primary"
          >
            Nova simulação
          </Link>
        </div>
      </div>
    </div>
  )
}
