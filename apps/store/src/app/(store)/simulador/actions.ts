'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import type { Json } from '@vello/database'

export async function saveSimulation(input: {
  tenantProductId: string
  clientName: string
  clientPhone: string
  desiredAmount: number
  desiredTermMonths: number
  estimatedRate: number
  estimatedPayment: number
  simulationData: Record<string, unknown>
}): Promise<string | null> {
  const tenantId = (await headers()).get('x-tenant-id')
  if (!tenantId) return null

  const supabase = createServiceClient()

  const { data: tp } = await supabase
    .from('tenant_products')
    .select('product_id')
    .eq('id', input.tenantProductId)
    .eq('tenant_id', tenantId)
    .single()

  if (!tp) return null

  const { data, error } = await supabase
    .from('simulations')
    .insert({
      tenant_id: tenantId,
      product_id: tp.product_id,
      client_name: input.clientName,
      client_phone: input.clientPhone,
      desired_amount: input.desiredAmount,
      desired_term_months: input.desiredTermMonths,
      estimated_rate: input.estimatedRate,
      estimated_payment: input.estimatedPayment,
      simulation_data: input.simulationData as Json,
      status: 'rascunho',
    })
    .select('id')
    .single()

  if (error || !data) return null
  return data.id
}

export async function qualifySimulation(simulationId: string): Promise<void> {
  const tenantId = (await headers()).get('x-tenant-id')
  if (!tenantId) return

  const supabase = createServiceClient()
  await supabase
    .from('simulations')
    .update({ status: 'pre_qualificado' })
    .eq('id', simulationId)
    .eq('tenant_id', tenantId)

  redirect(`/thank-you/${simulationId}`)
}
