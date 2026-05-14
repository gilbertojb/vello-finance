'use client'

import { useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { CATEGORY_LABELS, PRODUCT_CATEGORIES } from '../product-schema'

type Props = {
  category?: string
  status?: string
  q?: string
}

export function ProductFilters({ category = '', status = '', q = '' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    const merged = { category, status, q, ...overrides }
    if (merged.category) params.set('category', merged.category)
    if (merged.status) params.set('status', merged.status)
    if (merged.q) params.set('q', merged.q)
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  function handleSelect(key: 'category' | 'status', value: string) {
    router.push(buildUrl({ [key]: value }))
  }

  function handleSearch(value: string) {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ q: value }))
    }, 300)
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        defaultValue={category}
        onChange={(e) => handleSelect('category', e.target.value)}
      >
        <option value="">Todas as categorias</option>
        {PRODUCT_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {CATEGORY_LABELS[cat]}
          </option>
        ))}
      </select>

      <select
        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        defaultValue={status}
        onChange={(e) => handleSelect('status', e.target.value)}
      >
        <option value="">Todos os status</option>
        <option value="active">Ativo</option>
        <option value="inactive">Inativo</option>
      </select>

      <Input
        className="w-64"
        placeholder="Buscar por nome..."
        defaultValue={q}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  )
}
