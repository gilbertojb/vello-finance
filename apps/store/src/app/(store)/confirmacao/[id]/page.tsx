import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/simulator'
import { getProposalConfirmation } from '../../queries'

export const metadata: Metadata = { title: 'Solicitação recebida' }

type Props = {
  params: Promise<{ id: string }>
}

export default async function ConfirmationPage({ params }: Props) {
  const { id } = await params
  const tenantId = (await headers()).get('x-tenant-id') ?? ''

  const proposal = await getProposalConfirmation(id, tenantId)
  if (!proposal) notFound()

  const protocol = proposal.id.replace(/-/g, '').slice(0, 8).toUpperCase()
  // biome-ignore lint/suspicious/noExplicitAny: supabase join type
  const productName = (proposal.products as any)?.name ?? ''

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-6">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-primary" strokeWidth={1.5} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Solicitação recebida!
          </h1>
          <p className="text-muted-foreground">
            Olá, <strong>{proposal.client_name}</strong>! Recebemos sua solicitação
            de crédito para <strong>{productName}</strong>.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card px-6 py-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Número do protocolo
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-primary">
            #{protocol}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Valor solicitado:{' '}
            <strong className="text-foreground">
              {formatCurrency(proposal.desired_amount)}
            </strong>{' '}
            · Prazo:{' '}
            <strong className="text-foreground">
              {proposal.desired_term_months} meses
            </strong>
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          Nossa equipe entrará em contato pelo e-mail cadastrado em breve.
        </p>

        <Button asChild className="w-full">
          <Link href="/">Fazer nova simulação</Link>
        </Button>
      </div>
    </div>
  )
}
