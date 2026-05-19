import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { getProposal } from '@/app/(store)/queries'

type Props = { params: Promise<{ proposalId: string }> }

export default async function FinalizadoPage({ params }: Props) {
  const { proposalId } = await params
  const tenantId = (await headers()).get('x-tenant-id')
  if (!tenantId) notFound()

  const proposal = await getProposal(proposalId, tenantId)
  if (!proposal) notFound()

  const isFgts = proposal.product_type_slug === 'fgts'

  const productName = proposal.products?.name ?? ''

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <div className="flex flex-col items-center rounded-2xl border border-surface-foreground/10 bg-white p-8 text-center max-sm:p-6">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>

        {productName && (
          <span className="mb-4 inline-flex items-center rounded-full bg-primary/15 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-label text-surface-foreground">
            {productName}
          </span>
        )}

        <h1 className="mb-3 text-2xl font-extrabold tracking-tight text-surface-foreground">
          {isFgts ? 'Dados recebidos!' : 'Documentos enviados!'}
        </h1>

        <p className="text-base leading-relaxed text-surface-foreground/70">
          {isFgts
            ? 'Em breve, você receberá o link para seguir com a contratação do crédito. Fique atento ao seu e-mail e WhatsApp, entraremos em contato com os próximos passos!'
            : 'Agora, nossa equipe jurídica e os analistas de crédito darão continuidade à análise. Fique de olho no seu e-mail e WhatsApp, em breve entraremos em contato com os próximos passos.'}
        </p>

        <div className="mt-6 w-full rounded-lg border border-surface-foreground/10 bg-surface px-6 py-4 text-left">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-surface-foreground/50">
            Número da proposta
          </p>
          <p className="font-mono text-sm text-surface-foreground/70">{proposalId}</p>
        </div>

        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-surface-foreground px-8 py-3 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
