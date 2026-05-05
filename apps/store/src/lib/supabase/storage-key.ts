// Isolamento de sessão entre tenants.
// Cada tenant tem seu próprio cookie, nomeado pelo tenant_id (UUID).
const STORAGE_KEY_PREFIX = 'vello-store-auth'

export function getStorageKey(tenantId: string): string {
  return `${STORAGE_KEY_PREFIX}-${tenantId}`
}
