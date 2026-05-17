'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import type { Json } from '@vello/database'

const saveSimulationSchema = z.object({
  tenantProductId: z.string().uuid(),
  clientName: z.string().min(2, 'Nome obrigatório'),
  clientPhone: z.string().min(10, 'Telefone inválido'),
  desiredAmount: z.number().positive('Valor inválido'),
  desiredTermMonths: z.number().int().positive('Prazo inválido'),
  estimatedRate: z.number().positive('Taxa inválida'),
  estimatedPayment: z.number().min(0),
  simulationData: z.record(z.unknown()),
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
  await supabase
    .from('simulations')
    .update({ status: 'pre_qualificado' })
    .eq('id', simulationId)
    .eq('tenant_id', tenantId)

  redirect(`/thank-you/${simulationId}`)
}
