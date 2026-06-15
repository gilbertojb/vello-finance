import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, ChevronLeft } from 'lucide-react'

import { getRequiredDocs } from '@vello/proposals-shared/required-documents'
import { getStatusLabel } from '@vello/proposals-shared/status-config'

import { readClientSession } from '@/app/(store)/meus-documentos/_lib/session'
import { hashIp, hashUserAgent } from '@/app/(store)/meus-documentos/_lib/cpf-hash'
import { logAccess } from '@/app/(store)/meus-documentos/_lib/audit'
import { getClientProposal } from '@/app/(store)/meus-documentos/queries'
import { ClientHeader } from '@/app/(store)/meus-documentos/_components/client-header'
import { DocumentUploader } from '@/app/(store)/meus-documentos/_components/document-uploader'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ proposalId: string }>
}

export default async function ProposalDocumentsPage({ params }: PageProps) {
  const { proposalId } = await params
  const h = await headers()
  const tenantId = h.get('x-tenant-id') ?? ''
  if (!tenantId) redirect('/meus-documentos')

  const session = await readClientSession(tenantId)
  if (!session) redirect('/meus-documentos')

  const proposal = await getClientProposal(proposalId, tenantId, session.cpf_hash)
  if (!proposal) notFound()

  await logAccess({
    tenantId,
    proposalId,
    action: 'viewed_proposal',
    ipHash: hashIp(h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0'),
    userAgentHash: hashUserAgent(h.get('user-agent') ?? ''),
  })

  const required = getRequiredDocs(proposal.product_type_slug)
  const uploadedDocs = Array.isArray(proposal.proposal_documents) ? proposal.proposal_documents : []
  const uploadedTypes = new Set(uploadedDocs.map((d) => d.document_type))
  const allSent = required.every((r) => uploadedTypes.has(r.type))

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 md:py-16">
      <ClientHeader title="Portal do cliente" />
      <div className="flex flex-col gap-3">
        <Link
          href="/meus-documentos/propostas"
          className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="size-3" />
          Voltar para propostas
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Documentos<span className="text-primary">.</span>
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground">
            PROP-{proposal.id.slice(0, 4).toUpperCase()}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground">
            {getStatusLabel(proposal.status)}
          </span>
        </div>
      </div>

      {allSent ? (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/8 px-5 py-4">
          <CheckCircle2 className="size-5 text-success" />
          <p className="text-sm font-medium text-foreground">
            Tudo certo. Aguarde a análise da equipe.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {required.map((doc) => (
            <DocumentUploader
              key={doc.type}
              proposalId={proposal.id}
              documentType={doc.type}
              label={doc.label}
              sent={uploadedTypes.has(doc.type)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
