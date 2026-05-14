import { describe, expect, it } from 'vitest'
import { productSchema } from '../product-schema'

describe('productSchema', () => {
  it('aceita category válida', () => {
    const result = productSchema.safeParse({
      name: 'FGTS – QI Tech',
      product_type_id: '00000000-0000-0000-0000-000000000001',
      category: 'pessoa_fisica',
      is_active: true,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita category inválida', () => {
    const result = productSchema.safeParse({
      name: 'FGTS – QI Tech',
      product_type_id: '00000000-0000-0000-0000-000000000001',
      category: 'invalida',
      is_active: true,
    })
    expect(result.success).toBe(false)
  })

  it('rejeita schema sem category', () => {
    const result = productSchema.safeParse({
      name: 'FGTS – QI Tech',
      product_type_id: '00000000-0000-0000-0000-000000000001',
      is_active: true,
    })
    expect(result.success).toBe(false)
  })
})
