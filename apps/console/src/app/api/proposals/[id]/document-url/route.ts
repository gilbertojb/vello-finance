// apps/console/src/app/api/proposals/[id]/document-url/route.ts
import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: proposalId } = await params
  const storagePath = request.nextUrl.searchParams.get('path')

  if (!storagePath) {
    return NextResponse.json({ error: 'path obrigatório' }, { status: 400 })
  }

  // Verificar que a proposta pertence ao tenant autenticado (respeita RLS)
  const supabase = await createClient()
  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select('id')
    .eq('id', proposalId)
    .single()

  if (proposalError || !proposal) {
    return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
  }

  // Gerar URL assinada via service role (acesso ao bucket privado)
  const service = createServiceClient()
  const { data, error } = await service.storage
    .from('proposal-documents')
    .createSignedUrl(storagePath, 60) // TTL: 60 segundos

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Arquivo indisponível' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
