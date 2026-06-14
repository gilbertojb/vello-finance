'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

import { hashCpf, hashIp, hashUserAgent } from './_lib/cpf-hash'
import { checkRateLimit, recordAttempt } from './_lib/rate-limit'
import {
  signClientSession,
  setClientSessionCookie,
  clearClientSessionCookie,
  readClientSession,
} from './_lib/session'
import { validateUploadedFile } from './_lib/file-validation'
import { logAccess } from './_lib/audit'
import { createServiceClient } from '@/lib/supabase/service'
import { validateCPF } from '@/lib/utils/cpf'

const cpfSchema = z.object({
  cpf: z.string().transform((v) => v.replace(/\D/g, '')).refine(validateCPF, 'CPF inválido'),
})

const uploadSchema = z.object({
  proposalId: z.string().uuid(),
  documentType: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/),
})

const GENERIC_ERROR = 'Não foi possível validar. Tente novamente em alguns minutos.'

async function getRequestContext() {
  const h = await headers()
  const tenantId = h.get('x-tenant-id') ?? ''
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    '0.0.0.0'
  const ua = h.get('user-agent') ?? ''
  return { tenantId, ipHash: hashIp(ip), userAgentHash: hashUserAgent(ua) }
}

export async function validateCpfAction(formData: FormData): Promise<{ error?: string }> {
  const { tenantId, ipHash } = await getRequestContext()
  if (!tenantId) return { error: GENERIC_ERROR }

  const parsed = cpfSchema.safeParse({ cpf: formData.get('cpf') })
  if (!parsed.success) return { error: GENERIC_ERROR }

  const cpfHash = hashCpf(parsed.data.cpf)

  const { blocked } = await checkRateLimit({ ipHash, cpfHash })
  if (blocked) {
    await recordAttempt({ tenantId, ipHash, cpfHash, success: false })
    return { error: GENERIC_ERROR }
  }

  await recordAttempt({ tenantId, ipHash, cpfHash, success: true })

  const token = await signClientSession({ cpf_hash: cpfHash, tenant_id: tenantId })
  await setClientSessionCookie(token)

  redirect('/meus-documentos/propostas')
}

export async function logoutClientAction(): Promise<void> {
  await clearClientSessionCookie()
  redirect('/meus-documentos')
}

export async function uploadDocumentAction(
  formData: FormData,
): Promise<{ error?: string; ok?: true }> {
  const { tenantId, ipHash, userAgentHash } = await getRequestContext()
  if (!tenantId) return { error: 'Tenant não identificado' }

  const session = await readClientSession(tenantId)
  if (!session) return { error: 'Sessão expirada' }

  const parsedMeta = uploadSchema.safeParse({
    proposalId: formData.get('proposalId'),
    documentType: formData.get('documentType'),
  })
  if (!parsedMeta.success) return { error: 'Dados inválidos' }

  const file = formData.get('file')
  if (!(file instanceof File)) return { error: 'Arquivo ausente' }

  const supabase = createServiceClient()
  const { data: proposal } = await supabase
    .from('proposals')
    .select('id, tenant_id, client_cpf_hash')
    .eq('id', parsedMeta.data.proposalId)
    .single()
  if (
    !proposal ||
    proposal.tenant_id !== tenantId ||
    proposal.client_cpf_hash !== session.cpf_hash
  ) {
    return { error: 'Proposta não encontrada' }
  }

  const validation = await validateUploadedFile(file)
  if (!validation.ok) return { error: 'Arquivo inválido' }

  const storagePath = `${tenantId}/${parsedMeta.data.proposalId}/${parsedMeta.data.documentType}/${randomUUID()}.${validation.ext}`

  const { error: uploadErr } = await supabase.storage
    .from('proposal-documents')
    .upload(storagePath, validation.buffer, {
      contentType: validation.detectedMime,
      upsert: false,
    })
  if (uploadErr) return { error: 'Falha no upload' }

  const safeName = file.name.replace(/[^\w.\-]/g, '_').slice(0, 100)
  const { error: insertErr } = await supabase
    .from('proposal_documents')
    .upsert(
      {
        proposal_id: parsedMeta.data.proposalId,
        document_type: parsedMeta.data.documentType,
        storage_path: storagePath,
        file_name: safeName,
      },
      { onConflict: 'proposal_id,document_type' },
    )
  if (insertErr) return { error: 'Falha ao registrar documento' }

  await logAccess({
    tenantId,
    proposalId: parsedMeta.data.proposalId,
    action: 'uploaded',
    documentType: parsedMeta.data.documentType,
    ipHash,
    userAgentHash,
  })

  revalidatePath(`/meus-documentos/propostas/${parsedMeta.data.proposalId}`)
  return { ok: true }
}
