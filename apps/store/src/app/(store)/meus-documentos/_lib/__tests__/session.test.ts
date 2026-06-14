import { describe, expect, it, beforeAll } from 'vitest'
import { signClientSession, verifyClientSession } from '@/app/(store)/meus-documentos/_lib/session'

beforeAll(() => {
  process.env.CLIENT_SESSION_SECRET = 'test-secret-with-at-least-32-chars-xxxxxxxx'
})

describe('signClientSession / verifyClientSession', () => {
  const cpfHash = 'a'.repeat(64)
  const tenantId = '11111111-1111-1111-1111-111111111111'

  it('round-trips a valid payload', async () => {
    const token = await signClientSession({ cpf_hash: cpfHash, tenant_id: tenantId })
    const verified = await verifyClientSession(token, tenantId)
    expect(verified).not.toBeNull()
    expect(verified?.cpf_hash).toBe(cpfHash)
    expect(verified?.tenant_id).toBe(tenantId)
  })

  it('rejects token signed for a different tenant', async () => {
    const token = await signClientSession({ cpf_hash: cpfHash, tenant_id: tenantId })
    const otherTenant = '22222222-2222-2222-2222-222222222222'
    expect(await verifyClientSession(token, otherTenant)).toBeNull()
  })

  it('rejects expired token', async () => {
    const token = await signClientSession(
      { cpf_hash: cpfHash, tenant_id: tenantId },
      { expiresInSeconds: -1 },
    )
    expect(await verifyClientSession(token, tenantId)).toBeNull()
  })

  it('rejects tampered token', async () => {
    const token = await signClientSession({ cpf_hash: cpfHash, tenant_id: tenantId })
    const tampered = `${token}x`
    expect(await verifyClientSession(tampered, tenantId)).toBeNull()
  })
})
