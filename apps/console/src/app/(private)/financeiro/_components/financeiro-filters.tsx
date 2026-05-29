'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { DateRangePicker } from '@/components/date-range-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function FinanceiroFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function update(key: string, value: string | undefined) {
    const next = new URLSearchParams(params.toString())
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={params.get('status') ?? 'all'}
        onValueChange={(v) => update('status', v === 'all' ? undefined : v)}
      >
        <SelectTrigger className="h-9 w-44 text-sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="a_receber">A receber</SelectItem>
          <SelectItem value="pago">Pago</SelectItem>
        </SelectContent>
      </Select>

      <DateRangePicker
        from={params.get('de') ?? undefined}
        to={params.get('ate') ?? undefined}
        onChange={(de, ate) => {
          const next = new URLSearchParams(params.toString())
          de ? next.set('de', de) : next.delete('de')
          ate ? next.set('ate', ate) : next.delete('ate')
          router.push(`${pathname}?${next.toString()}`)
        }}
      />
    </div>
  )
}
