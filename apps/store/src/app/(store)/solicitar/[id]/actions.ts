'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { validateCPF } from '@/lib/utils/cpf'

const proposalSchema = z.object({
  // Passo 1 (via hidden inputs)
  purpose: z.enum(['pessoal', 'empresa', 'imovel', 'veiculo', 'outro'], {
    errorMap: () => ({ message: 'Selecione uma finalidade' }),
  }),
  desired_amount: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .positive('Informe um valor positivo'),
  desired_term_months: z.coerce
    .number({ invalid_type_error: 'Prazo inválido' })
    .int()
    .positive(),
  client_name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  client_email: z.string().email('E-mail inválido'),

  // Passo 2
  client_cpf: z
    .string()
    .refine((v) => validateCPF(v), 'CPF inválido'),
  client_phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length >= 10 && v.length <= 11, 'Telefone inválido'),
  client_birthdate: z.string().refine((d) => {
    const birth = new Date(d)
    if (Number.isNaN(birth.getTime())) return false
    const ageDays = (Date.now() - birth.getTime()) / 86400000
    return ageDays >= 18 * 365.25
  }, 'Você deve ter 18 anos ou mais'),

  // Endereço
  zip: z.string().transform((v) => v.replace(/\D/g, '')),
  street: z.string().min(1, 'Rua obrigatória'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Bairro obrigatório'),
  city: z.string().min(1, 'Cidade obrigatória'),
  state: z.string().length(2, 'UF inválida'),
})

export type ActionResult = {
  success: boolean
  message: string | null
  errors: Record<string, string[]> | null
}

export async function createProposal(
  tenantProductId: string,
  productId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')

  if (!tenantId) {
    return { success: false, message: 'Tenant não identificado', errors: null }
  }

  const raw = Object.fromEntries(formData)
  const parsed = proposalSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      message: 'Corrija os erros no formulário',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const d = parsed.data
  const address = {
    zip: d.zip,
    street: d.street,
    number: d.number,
    complement: d.complement,
    neighborhood: d.neighborhood,
    city: d.city,
    state: d.state,
  }

  const supabase = createServiceClient()
  const { data: proposal, error } = await supabase
    .from('proposals')
    .insert({
      tenant_id: tenantId,
      product_id: productId,
      status: 'simulation',
      purpose: d.purpose,
      desired_amount: d.desired_amount,
      desired_term_months: d.desired_term_months,
      client_name: d.client_name,
      client_email: d.client_email,
      client_cpf: d.client_cpf.replace(/\D/g, ''),
      client_phone: d.client_phone,
      client_birthdate: d.client_birthdate,
      client_address: address,
    })
    .select('id')
    .single()

  if (error || !proposal) {
    return {
      success: false,
      message: 'Erro ao registrar solicitação. Tente novamente.',
      errors: null,
    }
  }

  redirect(`/confirmacao/${proposal.id}`)
}
