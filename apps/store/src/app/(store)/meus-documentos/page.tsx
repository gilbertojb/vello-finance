import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { CpfForm } from './_components/cpf-form'
import { readClientSession } from './_lib/session'

export const dynamic = 'force-dynamic'

export default async function MeusDocumentosPage() {
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  if (tenantId) {
    const session = await readClientSession(tenantId)
    if (session) redirect('/meus-documentos/propostas')
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-8 px-4 py-12 md:py-20">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Portal do cliente
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Documentos<span className="text-primary">.</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Informe seu CPF para visualizar suas propostas e enviar documentos pendentes.
        </p>
      </div>
      <CpfForm />
    </section>
  )
}
