import { describe, expect, it } from 'vitest'
import {
  RATE_LIMIT_IP_MAX,
  RATE_LIMIT_IP_WINDOW_MIN,
  RATE_LIMIT_CPF_MAX,
  RATE_LIMIT_CPF_WINDOW_MIN,
  isOverLimit,
} from '@/app/(store)/meus-documentos/_lib/rate-limit'

describe('rate-limit constants', () => {
  it('IP limit defaults to 5 per 15 minutes', () => {
    expect(RATE_LIMIT_IP_MAX).toBe(5)
    expect(RATE_LIMIT_IP_WINDOW_MIN).toBe(15)
  })

  it('CPF limit defaults to 10 per 60 minutes', () => {
    expect(RATE_LIMIT_CPF_MAX).toBe(10)
    expect(RATE_LIMIT_CPF_WINDOW_MIN).toBe(60)
  })
})

describe('isOverLimit', () => {
  it('returns false when ipCount and cpfCount under limits', () => {
    expect(isOverLimit({ ipCount: 4, cpfCount: 9 })).toBe(false)
  })

  it('returns true when ipCount reaches IP limit', () => {
    expect(isOverLimit({ ipCount: 5, cpfCount: 0 })).toBe(true)
  })

  it('returns true when cpfCount reaches CPF limit', () => {
    expect(isOverLimit({ ipCount: 0, cpfCount: 10 })).toBe(true)
  })

  it('returns true when either exceeds', () => {
    expect(isOverLimit({ ipCount: 6, cpfCount: 11 })).toBe(true)
  })
})
