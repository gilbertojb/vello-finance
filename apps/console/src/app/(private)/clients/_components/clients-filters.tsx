'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'

import { DateRangePicker } from '@/components/date-range-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props {
  products: string[]
}

const STAGES = [
  { value: 'abandoned',      label: 'Abandonou' },
  { value: 'simulated',      label: 'Simulou' },
  { value: 'in_contracting', label: 'Em contratação' },
  { value: 'contracted',     label: 'Contratou' },
]

export function ClientsFilters({ products }: Props) {
  const router = useRouter()
  const params = useSearchParams()

  const push = useCallback(
    (key: string, value: string | undefined) => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set(key, value)
      else next.delete(key)
      router.push(`/clients?${next.toString()}`)
    },
    [params, router],
  )

  const dateRange: DateRange | undefined =
    params.get('from')
      ? { from: new Date(params.get('from')!), to: params.get('to') ? new Date(params.get('to')!) : undefined }
      : undefined

  function onDateChange(range: DateRange | undefined) {
    const next = new URLSearchParams(params.toString())
    if (range?.from) next.set('from', format(range.from, 'yyyy-MM-dd'))
    else next.delete('from')
    if (range?.to) next.set('to', format(range.to, 'yyyy-MM-dd'))
    else next.delete('to')
    router.push(`/clients?${next.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={params.get('stage') ?? 'all'}
        onValueChange={(v) => push('stage', v === 'all' ? undefined : v)}
      >
        <SelectTrigger className="h-9 w-40 text-xs">
          <SelectValue placeholder="Estágio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os estágios</SelectItem>
          {STAGES.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.get('product') ?? 'all'}
        onValueChange={(v) => push('product', v === 'all' ? undefined : v)}
      >
        <SelectTrigger className="h-9 w-44 text-xs">
          <SelectValue placeholder="Produto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os produtos</SelectItem>
          {products.map((p) => (
            <SelectItem key={p} value={p}>{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DateRangePicker value={dateRange} onChange={onDateChange} />
    </div>
  )
}
