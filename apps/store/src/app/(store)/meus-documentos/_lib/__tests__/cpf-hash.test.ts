import { describe, expect, it, beforeAll } from 'vitest'
import { hashCpf, hashIp, hashUserAgent } from '@/app/(store)/meus-documentos/_lib/cpf-hash'

beforeAll(() => {
  process.env.SUPABASE_CPF_PEPPER = 'test-pepper-with-at-least-32-characters-xxxxxx'
})

describe('hashCpf', () => {
  it('returns hex sha256 of digits-only CPF + pepper', () => {
    const h1 = hashCpf('123.456.789-09')
    const h2 = hashCpf('12345678909')
    expect(h1).toBe(h2)
    expect(h1).toMatch(/^[0-9a-f]{64}$/)
  })

  it('produces different hashes for different CPFs', () => {
    expect(hashCpf('11111111111')).not.toBe(hashCpf('22222222222'))
  })

  it('throws if pepper is missing', () => {
    const before = process.env.SUPABASE_CPF_PEPPER
    delete process.env.SUPABASE_CPF_PEPPER
    expect(() => hashCpf('12345678909')).toThrow()
    process.env.SUPABASE_CPF_PEPPER = before
  })
})

describe('hashIp', () => {
  it('returns hex sha256 of ip + pepper', () => {
    expect(hashIp('127.0.0.1')).toMatch(/^[0-9a-f]{64}$/)
  })

  it('produces different hash than hashCpf for same input', () => {
    expect(hashIp('12345678909')).not.toBe(hashCpf('12345678909'))
  })
})

describe('hashUserAgent', () => {
  it('returns hex sha256 of UA + pepper', () => {
    expect(hashUserAgent('Mozilla/5.0')).toMatch(/^[0-9a-f]{64}$/)
  })

  it('handles empty UA returning consistent hash', () => {
    expect(hashUserAgent('')).toMatch(/^[0-9a-f]{64}$/)
  })
})
