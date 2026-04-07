'use client'

import { InputMask } from '@react-input/mask'
import { type ComponentProps, useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

const inputClass =
  'h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40'

// ---------------------------------------------------------------------------
// PhoneInput — (XX) XXXXX-XXXX  via @react-input/mask
// ---------------------------------------------------------------------------

export function PhoneInput({
  className,
  ...props
}: ComponentProps<typeof InputMask>) {
  return (
    <InputMask
      mask="(__) _____-____"
      replacement={{ _: /\d/ }}
      inputMode="numeric"
      placeholder="(11) 99999-9999"
      className={cn(inputClass, className)}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// Helpers compartilhados
// ---------------------------------------------------------------------------

/**
 * Converte um valor raw (número, string inglesa ou string BR) para o
 * formato de exibição brasileiro: "1.234,56".
 * Detecta o formato pelo separador: vírgula → BR, ponto → inglês.
 */
function parseToBrDisplay(
  raw: unknown,
  opts: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 },
): string {
  if (raw === '' || raw == null) return ''
  if (typeof raw === 'number') {
    return isNaN(raw) ? '' : raw.toLocaleString('pt-BR', opts)
  }
  const str = String(raw).trim()
  if (!str) return ''
  const num = str.includes(',')
    ? parseFloat(str.replace(/\./g, '').replace(',', '.')) // "1.234,56" → 1234.56
    : parseFloat(str)                                       // "1234.56"  → 1234.56
  return isNaN(num) ? '' : num.toLocaleString('pt-BR', opts)
}

/**
 * Extrai dígitos do valor exibido, interpreta como centavos (right-to-left fill)
 * e devolve a string formatada para exibição.
 */
function centsToDisplay(rawInput: string, divisor: number): string {
  const digits = rawInput.replace(/\D/g, '').replace(/^0+/, '')
  if (!digits) return ''
  return (parseInt(digits, 10) / divisor).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// ---------------------------------------------------------------------------
// PercentInput — até 999,99 %
// Suporta modo controlado (value prop) para auto-preenchimento externo.
// ---------------------------------------------------------------------------

type PercentInputProps = Omit<ComponentProps<'input'>, 'type'>

export function PercentInput({
  className,
  defaultValue,
  value: valueProp,
  onChange,
  ...props
}: PercentInputProps) {
  const [display, setDisplay] = useState(() =>
    parseToBrDisplay(valueProp ?? defaultValue),
  )

  // Sincroniza com valor externo (modo controlado)
  useEffect(() => {
    if (valueProp !== undefined) {
      setDisplay(parseToBrDisplay(valueProp))
    }
  }, [valueProp])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = centsToDisplay(e.target.value, 100)
    setDisplay(formatted)
    Object.defineProperty(e, 'target', {
      writable: false,
      value: Object.assign(e.target, { value: formatted }),
    })
    onChange?.(e)
  }

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        placeholder="0,00"
        value={display}
        onChange={handleChange}
        className={cn(inputClass, 'pr-8', className)}
        {...props}
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 select-none text-sm text-muted-foreground">
        %
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// MoneyInput — R$ 0,01 … 9.999.999,99
// ---------------------------------------------------------------------------

type MoneyInputProps = Omit<ComponentProps<'input'>, 'type'>

export function MoneyInput({
  className,
  defaultValue,
  onChange,
  ...props
}: MoneyInputProps) {
  const [display, setDisplay] = useState(() => parseToBrDisplay(defaultValue))

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = centsToDisplay(e.target.value, 100)
    setDisplay(formatted)
    Object.defineProperty(e, 'target', {
      writable: false,
      value: Object.assign(e.target, { value: formatted }),
    })
    onChange?.(e)
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 select-none text-sm text-muted-foreground">
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="0,00"
        value={display}
        onChange={handleChange}
        className={cn(inputClass, 'pl-8', className)}
        {...props}
      />
    </div>
  )
}
