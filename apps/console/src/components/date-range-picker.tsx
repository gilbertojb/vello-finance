'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ── Presets ───────────────────────────────────────────────────────────────────

interface Preset {
  label: string
  range: () => DateRange
}

const PRESETS: Preset[] = [
  {
    label: 'Hoje',
    range: () => { const d = new Date(); return { from: d, to: d } },
  },
  {
    label: 'Últimos 7 dias',
    range: () => ({ from: subDays(new Date(), 6), to: new Date() }),
  },
  {
    label: 'Últimos 30 dias',
    range: () => ({ from: subDays(new Date(), 29), to: new Date() }),
  },
  {
    label: 'Últimos 90 dias',
    range: () => ({ from: subDays(new Date(), 89), to: new Date() }),
  },
  {
    label: 'Este mês',
    range: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
  },
  {
    label: 'Mês anterior',
    range: () => {
      const prev = subMonths(new Date(), 1)
      return { from: startOfMonth(prev), to: endOfMonth(prev) }
    },
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function isActivePreset(preset: Preset, value: DateRange | undefined): boolean {
  if (!value?.from || !value?.to) return false
  const r = preset.range()
  return (
    format(r.from!, 'yyyy-MM-dd') === format(value.from, 'yyyy-MM-dd') &&
    format(r.to!, 'yyyy-MM-dd') === format(value.to, 'yyyy-MM-dd')
  )
}

function formatLabel(value: DateRange | undefined): string {
  if (!value?.from) return 'Selecionar período'
  if (!value.to) return format(value.from, 'dd/MM/yyyy', { locale: ptBR })
  return `${format(value.from, 'dd/MM/yy', { locale: ptBR })} – ${format(value.to, 'dd/MM/yy', { locale: ptBR })}`
}

// ── Componente ─────────────────────────────────────────────────────────────────

interface DateRangePickerProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  className?: string
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  function applyPreset(preset: Preset) {
    onChange(preset.range())
  }

  function clear() {
    onChange(undefined)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('gap-2 border-input bg-transparent font-normal shadow-xs', !value?.from && 'text-muted-foreground', className)}
        >
          <CalendarIcon size={14} />
          {formatLabel(value)}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          {/* Presets laterais */}
          <div className="flex w-36 flex-col gap-0.5 border-r p-2">
            <p className="px-2 pb-1 pt-0.5 text-xs font-medium text-muted-foreground">
              Atalhos
            </p>
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant={isActivePreset(preset, value) ? 'secondary' : 'ghost'}
                size="sm"
                className="justify-start text-xs"
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </Button>
            ))}
            {value?.from && (
              <>
                <Separator className="my-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-xs text-muted-foreground"
                  onClick={clear}
                >
                  Limpar
                </Button>
              </>
            )}
          </div>

          {/* Calendário */}
          <Calendar
            mode="range"
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
            locale={ptBR}
            disabled={{ after: new Date() }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
