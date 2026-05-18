import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
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

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
      </div>

      <h1 className="mb-3 text-2xl font-bold">
        {isFgts ? 'Dados recebidos!' : 'Documentos enviados!'}
      </h1>

      <p className="text-base leading-relaxed text-muted-foreground">
        {isFgts
          ? 'Em breve, você receberá o link para seguir com a contratação do crédito. Fique atento ao seu e-mail e WhatsApp, entraremos em contato com os próximos passos!'
          : 'Agora, nossa equipe jurídica e os analistas de crédito darão continuidade à análise. Fique de olho no seu e-mail e WhatsApp, em breve entraremos em contato com os próximos passos.'}
      </p>

      <div className="mt-8 w-full rounded-lg border bg-muted/30 px-6 py-4 text-left">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Número da proposta
        </p>
        <p className="font-mono text-sm text-muted-foreground">{proposalId}</p>
      </div>
    </div>
  )
}
