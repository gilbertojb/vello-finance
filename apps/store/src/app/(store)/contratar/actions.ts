'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import type { Json } from '@vello/database'

async function getTenantId(): Promise<string | null> {
  return (await headers()).get('x-tenant-id')
}

const createProposalSchema = z.object({
  productId: z.string().uuid(),
  productTypeSlug: z.string().min(1),
  simulationId: z.string().uuid().optional(),
  stepSlug: z.string().min(1),
  stepData: z.record(z.string(), z.unknown()),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  nextStep: z.string().min(1),
})

export async function createProposal(
  input: z.input<typeof createProposalSchema>,
): Promise<{ error: string } | { redirectTo: string }> {
  const tenantId = await getTenantId()
  if (!tenantId) return { error: 'Tenant não identificado.' }

  const parsed = createProposalSchema.safeParse(input)
  if (!parsed.success) return { error: 'Dados inválidos.' }

  const { productId, productTypeSlug, simulationId, stepSlug, stepData, clientName, clientPhone, nextStep } = parsed.data
  const supabase = createServiceClient()

  const { data: tp } = await supabase
    .from('tenant_products')
    .select(`
      id,
      products ( id )
    `)
    .eq('id', productId)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single()

  if (!tp) return { error: 'Produto não encontrado.' }

  const { data: proposal, error } = await supabase
    .from('proposals')
    .insert({
      tenant_id: tenantId,
      product_id: (tp.products as { id: string }).id,
      product_type_slug: productTypeSlug,
      simulation_id: simulationId ?? null,
      status: 'nova_proposta',
      current_step: nextStep,
      client_name: clientName ?? null,
      client_phone: clientPhone ?? null,
      form_data: { [stepSlug]: stepData } as Json,
    })
    .select('id')
    .single()

  if (error || !proposal) return { error: 'Erro ao criar proposta.' }

  return {
    redirectTo: `/contratar/${productTypeSlug.replace(/_/g, '-')}?step=${nextStep}&proposalId=${proposal.id}&productId=${productId}`,
  }
}

const saveStepSchema = z.object({
  proposalId: z.string().uuid(),
  stepSlug: z.string().min(1),
  stepData: z.record(z.string(), z.unknown()),
  nextStep: z.string().min(1),
})

export async function saveStep(
  input: z.input<typeof saveStepSchema>,
): Promise<{ error: string } | { redirectTo: string }> {
  const tenantId = await getTenantId()
  if (!tenantId) return { error: 'Tenant não identificado.' }

  const parsed = saveStepSchema.safeParse(input)
  if (!parsed.success) return { error: 'Dados inválidos.' }

  const { proposalId, stepSlug, stepData, nextStep } = parsed.data
  const supabase = createServiceClient()

  const { data: current } = await supabase
    .from('proposals')
    .select('form_data, product_type_slug')
    .eq('id', proposalId)
    .eq('tenant_id', tenantId)
    .single()

  if (!current) return { error: 'Proposta não encontrada.' }

  const mergedFormData = {
    ...(current.form_data as Record<string, unknown>),
    [stepSlug]: stepData,
  }

  const { error } = await supabase
    .from('proposals')
    .update({
      form_data: mergedFormData as Json,
      current_step: nextStep,
    })
    .eq('id', proposalId)
    .eq('tenant_id', tenantId)

  if (error) return { error: 'Erro ao salvar.' }

  const urlSlug = current.product_type_slug.replace(/_/g, '-')
  return { redirectTo: `/contratar/${urlSlug}?step=${nextStep}&proposalId=${proposalId}` }
}

export async function finalizeEtapa1(proposalId: string): Promise<{ error: string } | void> {
  const tenantId = await getTenantId()
  if (!tenantId) return { error: 'Tenant não identificado.' }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('proposals')
    .update({ status: 'proposta_criada', current_step: 'retorno' })
    .eq('id', proposalId)
    .eq('tenant_id', tenantId)

  if (error) return { error: 'Erro ao finalizar.' }
}

export async function uploadDocument(
  proposalId: string,
  documentType: string,
  formData: FormData,
): Promise<{ storagePath: string } | { error: string }> {
  const tenantId = await getTenantId()
  if (!tenantId) return { error: 'Tenant não identificado.' }

  const file = formData.get('file') as File | null
  if (!file) return { error: 'Arquivo não encontrado.' }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg']
  if (!allowedTypes.includes(file.type)) return { error: 'Formato inválido. Use PDF ou JPEG.' }

  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) return { error: 'Arquivo muito grande. Máximo 10MB.' }

  const supabase = createServiceClient()

  const { data: proposal } = await supabase
    .from('proposals')
    .select('id')
    .eq('id', proposalId)
    .eq('tenant_id', tenantId)
    .single()

  if (!proposal) return { error: 'Proposta não encontrada.' }

  const ext = file.name.split('.').pop()
  const storagePath = `${tenantId}/${proposalId}/${documentType}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('proposal-documents')
    .upload(storagePath, file, { upsert: true })

  if (uploadError) return { error: 'Erro ao fazer upload.' }

  await supabase
    .from('proposal_documents')
    .upsert(
      { proposal_id: proposalId, document_type: documentType, storage_path: storagePath, file_name: file.name },
      { onConflict: 'proposal_id,document_type' },
    )

  return { storagePath }
}

export async function finalizeEtapa2(proposalId: string): Promise<{ error: string } | void> {
  const tenantId = await getTenantId()
  if (!tenantId) return { error: 'Tenant não identificado.' }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('proposals')
    .update({ documents_submitted: true, status: 'em_analise' })
    .eq('id', proposalId)
    .eq('tenant_id', tenantId)

  if (error) return { error: 'Erro ao finalizar envio.' }

  redirect(`/proposta/${proposalId}/finalizado`)
}
