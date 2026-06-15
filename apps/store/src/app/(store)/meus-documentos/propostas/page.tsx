import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { readClientSession } from '@/app/(store)/meus-documentos/_lib/session'
import { hashIp, hashUserAgent } from '@/app/(store)/meus-documentos/_lib/cpf-hash'
import { logAccess } from '@/app/(store)/meus-documentos/_lib/audit'
import { listClientProposals } from '@/app/(store)/meus-documentos/queries'
import { ClientHeader } from '@/app/(store)/meus-documentos/_components/client-header'
import { ProposalCard } from '@/app/(store)/meus-documentos/_components/proposal-card'

export const dynamic = 'force-dynamic'

export default async function PropostasPage() {
  const h = await headers()
  const tenantId = h.get('x-tenant-id') ?? ''
  if (!tenantId) redirect('/meus-documentos')

  const session = await readClientSession(tenantId)
  if (!session) redirect('/meus-documentos')

  const proposals = await listClientProposals(tenantId, session.cpf_hash)

  if (proposals[0]) {
    await logAccess({
      tenantId,
      proposalId: proposals[0].id,
      action: 'viewed_list',
      ipHash: hashIp(h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0'),
      userAgentHash: hashUserAgent(h.get('user-agent') ?? ''),
    })
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 md:py-16">
      <ClientHeader title="Portal do cliente" />
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Suas propostas<span className="text-primary">.</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Clique em uma proposta para enviar documentos pendentes.
        </p>
      </div>

      {proposals.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-border bg-card/60 p-6">
          <p className="text-sm text-muted-foreground">
            Nenhuma proposta encontrada para este CPF nesta loja.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/simulador">Ir para o simulador</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {proposals.map((p) => (
            <ProposalCard
              key={p.id}
              id={p.id}
              status={p.status}
              productName={p.productName}
              pendingCount={p.pendingCount}
            />
          ))}
        </div>
      )}
    </section>
  )
}
