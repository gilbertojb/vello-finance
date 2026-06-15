import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { hashCpf } from '@/app/(store)/meus-documentos/_lib/cpf-hash'
import { validateCPF } from '@/lib/utils/cpf'

function extractCpfFromFormData(formData: Record<string, unknown>): string | null {
  for (const value of Object.values(formData)) {
    if (value && typeof value === 'object' && 'cpf' in value) {
      const raw = (value as { cpf?: unknown }).cpf
      if (typeof raw === 'string') {
        const digits = raw.replace(/\D/g, '')
        if (validateCPF(digits)) return digits
      }
    }
  }
  return null
}

function extractNameFromFormData(formData: Record<string, unknown>): string | null {
  for (const value of Object.values(formData)) {
    if (value && typeof value === 'object' && 'nome' in value) {
      const nome = (value as { nome?: unknown }).nome
      if (typeof nome === 'string' && nome.trim()) return nome.trim()
    }
  }
  return null
}

// One-time backfill: popula client_cpf_hash para propostas criadas antes da migration 20260613.
// Protegido pelo SUPABASE_CPF_PEPPER no header X-Backfill-Secret.
// Uso: curl -X POST <url>/api/backfill/cpf-hashes -H "X-Backfill-Secret: <pepper>"
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-backfill-secret')
  if (!secret || secret !== process.env.SUPABASE_CPF_PEPPER) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: proposals, error } = await supabase
    .from('proposals')
    .select('id, form_data, client_name')
    .is('client_cpf_hash', null)
    .limit(500)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!proposals?.length) {
    return NextResponse.json({ updated: 0, skipped: 0, message: 'Nenhuma proposta para backfill' })
  }

  let updated = 0
  let skipped = 0

  for (const p of proposals) {
    const formData = (p.form_data ?? {}) as Record<string, unknown>
    const cpf = extractCpfFromFormData(formData)

    if (!cpf) {
      skipped++
      continue
    }

    const updatePayload: Record<string, unknown> = {
      client_cpf_hash: hashCpf(cpf),
    }

    if (!p.client_name) {
      const name = extractNameFromFormData(formData)
      if (name) updatePayload.client_name = name
    }

    const { error: updateError } = await supabase
      .from('proposals')
      .update(updatePayload)
      .eq('id', p.id)

    if (updateError) {
      skipped++
    } else {
      updated++
    }
  }

  return NextResponse.json({ updated, skipped, total: proposals.length })
}
