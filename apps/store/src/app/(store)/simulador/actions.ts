'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { PRODUCT_FLOWS, DB_TO_URL_SLUG } from '@/app/(store)/contratar/[productTypeSlug]/_components/flow-config'
import type { Json } from '@vello/database'

const saveSimulationSchema = z.object({
  tenantProductId: z.string().uuid(),
  clientName: z.string().min(2, 'Nome obrigatório'),
  clientPhone: z.string().min(10, 'Telefone inválido'),
  desiredAmount: z.number().positive('Valor inválido'),
  desiredTermMonths: z.number().int().positive('Prazo inválido'),
  estimatedRate: z.number().positive('Taxa inválida'),
  estimatedPayment: z.number().min(0),
  simulationData: z.record(z.string(), z.unknown()),
})

export async function saveSimulation(
  input: z.input<typeof saveSimulationSchema>,
): Promise<{ success: boolean; message: string | null; errors: Record<string, string[]> | null; data?: { id: string } }> {
  const tenantId = (await headers()).get('x-tenant-id')
  if (!tenantId) return { success: false as const, message: 'Não autenticado.', errors: null }

  const parsed = saveSimulationSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, message: 'Dados inválidos.', errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = createServiceClient()
  const { data: d } = parsed

  const { data: tp } = await supabase
    .from('tenant_products')
    .select('product_id')
    .eq('id', d.tenantProductId)
    .eq('tenant_id', tenantId)
    .single()

  if (!tp) return { success: false as const, message: 'Erro ao salvar simulação.', errors: null }

  const { data, error } = await supabase
    .from('simulations')
    .insert({
      tenant_id: tenantId,
      product_id: tp.product_id,
      client_name: d.clientName,
      client_phone: d.clientPhone,
      desired_amount: d.desiredAmount,
      desired_term_months: d.desiredTermMonths,
      estimated_rate: d.estimatedRate,
      estimated_payment: d.estimatedPayment,
      simulation_data: d.simulationData as Json,
      status: 'rascunho',
    })
    .select('id')
    .single()

  if (error || !data) return { success: false as const, message: 'Erro ao salvar simulação.', errors: null }
  return { success: true as const, message: null, errors: null, data: { id: data.id } }
}

export async function qualifySimulation(simulationId: string): Promise<{ success: boolean; message: string | null; errors: Record<string, string[]> | null } | void> {
  const tenantId = (await headers()).get('x-tenant-id')
  if (!tenantId) return { success: false as const, message: 'Não autenticado.', errors: null }

  const supabase = createServiceClient()

  const { data: simulation } = await supabase
    .from('simulations')
    .select(`
      id,
      client_name,
      client_phone,
      product_id,
      products (
        id,
        product_type:product_types ( slug )
      )
    `)
    .eq('id', simulationId)
    .eq('tenant_id', tenantId)
    .single()

  if (!simulation) return { success: false as const, message: 'Simulação não encontrada.', errors: null }

  await supabase
    .from('simulations')
    .update({ status: 'pre_qualificado' })
    .eq('id', simulationId)
    .eq('tenant_id', tenantId)

  const productTypeSlug = (simulation.products as { product_type?: { slug?: string } } | null)?.product_type?.slug
  const urlSlug = productTypeSlug ? DB_TO_URL_SLUG[productTypeSlug] : null
  const firstStep = productTypeSlug ? PRODUCT_FLOWS[productTypeSlug]?.etapa1[0]?.slug : null

  if (!productTypeSlug || !urlSlug || !firstStep) {
    redirect(`/thank-you/${simulationId}`)
    return
  }

  const { data: tenantProduct } = await supabase
    .from('tenant_products')
    .select('id')
    .eq('product_id', simulation.product_id)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single()

  if (!tenantProduct) {
    redirect(`/thank-you/${simulationId}`)
    return
  }

  // Se proposta já existe para esta simulação, redirecionar para ela
  const { data: existing } = await supabase
    .from('proposals')
    .select('id, current_step')
    .eq('simulation_id', simulationId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (existing) {
    redirect(`/contratar/${urlSlug}?step=${existing.current_step}&proposalId=${existing.id}&productId=${tenantProduct.id}&simulationId=${simulationId}`)
    return
  }

  const { data: proposal } = await supabase
    .from('proposals')
    .insert({
      tenant_id: tenantId,
      product_id: simulation.product_id,
      product_type_slug: productTypeSlug,
      simulation_id: simulationId,
      status: 'nova_proposta',
      current_step: firstStep,
      client_name: simulation.client_name ?? null,
      client_phone: (simulation as unknown as { client_phone?: string }).client_phone ?? null,
      form_data: {} as Json,
    })
    .select('id')
    .single()

  if (!proposal) {
    redirect(`/thank-you/${simulationId}`)
    return
  }

  redirect(`/contratar/${urlSlug}?step=${firstStep}&proposalId=${proposal.id}&productId=${tenantProduct.id}&simulationId=${simulationId}`)
}
