'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { DateRangePicker } from '@/components/date-range-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  products: string[]
}

export function OrigemLeadsFilters({ products }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function update(key: string, value: string | undefined) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.push(`${pathname}?${next.toString()}`)
  }

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
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={params.get('product') ?? 'all'}
        onValueChange={(v) => update('product', v === 'all' ? undefined : v)}
      >
        <SelectTrigger className="h-9 w-48 text-sm">
          <SelectValue placeholder="Produto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os produtos</SelectItem>
          {products.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DateRangePicker value={dateRange} onChange={onDateChange} />
    </div>
  )
}
