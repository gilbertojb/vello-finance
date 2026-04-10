// Isolamento de sessão entre tenants.
// Cada tenant tem seu próprio cookie, nomeado pelo tenant_id (UUID).
// O tenant_id não é exposto em URLs (diferente do slug), o que impede
// fabricação de cookies por atores maliciosos.
const STORAGE_KEY_PREFIX = 'vello-console-auth'

export function getStorageKey(tenantId: string): string {
  return `${STORAGE_KEY_PREFIX}-${tenantId}`
}
