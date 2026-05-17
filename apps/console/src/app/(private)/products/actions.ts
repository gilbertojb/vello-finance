'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function toggleTenantProduct(id: string, isActive: boolean) {
  const supabase = await createClient()

  // RLS garante que o tenant só pode atualizar seus próprios registros
  const { error } = await supabase
    .from('tenant_products')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath('/products')
  return { success: true, message: null, errors: null }
}

export async function uploadProductCover(id: string, formData: FormData) {
  const file = formData.get('cover') as File | null
  if (!file || file.size === 0) {
    return {
      success: false,
      message: 'Nenhum arquivo válido enviado.',
      errors: null,
    }
  }

  // Máx 2MB
  if (file.size > 2 * 1024 * 1024) {
    return {
      success: false,
      message: 'O arquivo deve ter no máximo 2MB.',
      errors: null,
    }
  }

  const supabase = await createClient()

  // Buscar tenant_id via RLS
  const { data: tp } = await supabase
    .from('tenant_products')
    .select('tenant_id')
    .eq('id', id)
    .single()

  if (!tp?.tenant_id) {
    return { success: false, message: 'Produto não encontrado.', errors: null }
  }

  const serviceClient = createServiceClient()
  const path = `${tp.tenant_id}/products/${id}`

  const buffer = await file.arrayBuffer()
  const { error: uploadError } = await serviceClient.storage
    .from('tenant-assets')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    return { success: false, message: uploadError.message, errors: null }
  }

  const {
    data: { publicUrl },
  } = serviceClient.storage.from('tenant-assets').getPublicUrl(path)

  // Adicionar cache-busting para garantir que browsers/CDN não sirvam a versão anterior
  const publicUrlWithBust = `${publicUrl}?t=${Date.now()}`

  // Atualizar cover_url
  const { error } = await supabase
    .from('tenant_products')
    .update({ cover_url: publicUrlWithBust })
    .eq('id', id)

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath('/products')
  return {
    success: true,
    message: 'Capa atualizada com sucesso!',
    errors: null,
  }
}

export async function toggleTenantProductPopular(id: string, isPopular: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tenant_products')
    .update({ is_popular: isPopular })
    .eq('id', id)

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath('/products')
  return { success: true, message: null, errors: null }
}

export async function addTenantProduct(productId: string) {
  const tenantId = (await headers()).get('x-tenant-id')
  if (!tenantId) {
    return { success: false, message: 'Não autenticado.', errors: null }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('tenant_products').insert({
    tenant_id: tenantId,
    product_id: productId,
    tenant_commission_pct: 0,
    vello_spread_pct: 0,
    is_active: false,
  })

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath('/products')
  return {
    success: true,
    message: 'Produto adicionado ao seu portfólio!',
    errors: null,
  }
}
