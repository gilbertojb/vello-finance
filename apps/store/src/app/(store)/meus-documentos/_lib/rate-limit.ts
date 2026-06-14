import { createServiceClient } from '@/lib/supabase/service'

export const RATE_LIMIT_IP_MAX = 5
export const RATE_LIMIT_IP_WINDOW_MIN = 15
export const RATE_LIMIT_CPF_MAX = 10
export const RATE_LIMIT_CPF_WINDOW_MIN = 60

export function isOverLimit({
  ipCount,
  cpfCount,
}: { ipCount: number; cpfCount: number }): boolean {
  return ipCount >= RATE_LIMIT_IP_MAX || cpfCount >= RATE_LIMIT_CPF_MAX
}

export async function checkRateLimit({
  ipHash,
  cpfHash,
}: { ipHash: string; cpfHash: string }): Promise<{ blocked: boolean }> {
  const supabase = createServiceClient()
  const nowMs = Date.now()
  const ipFloor = new Date(nowMs - RATE_LIMIT_IP_WINDOW_MIN * 60_000).toISOString()
  const cpfFloor = new Date(nowMs - RATE_LIMIT_CPF_WINDOW_MIN * 60_000).toISOString()

  const [ipRes, cpfRes] = await Promise.all([
    supabase
      .from('client_access_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('attempted_at', ipFloor),
    supabase
      .from('client_access_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('cpf_hash', cpfHash)
      .gte('attempted_at', cpfFloor),
  ])

  return { blocked: isOverLimit({ ipCount: ipRes.count ?? 0, cpfCount: cpfRes.count ?? 0 }) }
}

export async function recordAttempt({
  tenantId,
  ipHash,
  cpfHash,
  success,
}: { tenantId: string; ipHash: string; cpfHash: string | null; success: boolean }): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('client_access_attempts').insert({
    tenant_id: tenantId,
    ip_hash: ipHash,
    cpf_hash: cpfHash,
    success,
  })
}
