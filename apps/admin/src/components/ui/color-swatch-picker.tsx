'use client'

import { Pipette } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

export interface ColorSwatchOption {
  value: string
  label: string
  color?: string // HEX ou cor CSS válida (fallback opcional)
  className?: string // Tailwind bg class
}

interface ColorSwatchPickerProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'onChange' | 'defaultValue'
  > {
  name: string
  options: ColorSwatchOption[]
  defaultValue?: string
  allowCustom?: boolean
}

const CUSTOM_KEY = '__custom__'
const HEX_RE = /^#[0-9a-fA-F]{6}$/

export function ColorSwatchPicker({
  name,
  options,
  defaultValue = '',
  allowCustom = false,
  className,
  ...props
}: ColorSwatchPickerProps) {
  const knownValues = React.useMemo(
    () => new Set(options.map((o) => o.value)),
    [options],
  )

  const isInitiallyCustom =
    allowCustom && defaultValue !== '' && !knownValues.has(defaultValue)

  const [selected, setSelected] = React.useState(
    isInitiallyCustom ? CUSTOM_KEY : defaultValue,
  )
  const [customHex, setCustomHex] = React.useState(
    isInitiallyCustom ? defaultValue : '#6366f1',
  )
  const [hexInput, setHexInput] = React.useState(
    isInitiallyCustom ? defaultValue : '#6366f1',
  )

  const storedValue = selected === CUSTOM_KEY ? customHex : selected

  function handleHexInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setHexInput(val)
    if (HEX_RE.test(val)) setCustomHex(val)
  }

  function handleColorPickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCustomHex(e.target.value)
    setHexInput(e.target.value)
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} {...props}>
      <input type="hidden" name={name} value={storedValue} />

      {options.map((opt) => {
        const isSelected = selected === opt.value
        const isDefault = opt.value === ''

        return (
          <button
            key={opt.value}
            type="button"
            title={opt.label}
            onClick={() => setSelected(opt.value)}
            className={cn(
              'relative flex items-center justify-center rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background',
              'size-8 border',
              isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
              isDefault && 'bg-muted',
              opt.className,
            )}
            style={opt.color ? { backgroundColor: opt.color } : undefined}
          />
        )
      })}

      {allowCustom && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Cor personalizada"
            onClick={() => setSelected(CUSTOM_KEY)}
            className={cn(
              'relative flex items-center justify-center rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background',
              'size-8 border',
              selected === CUSTOM_KEY
                ? 'ring-2 ring-primary ring-offset-2'
                : 'bg-muted',
            )}
            style={
              selected === CUSTOM_KEY ? { backgroundColor: customHex } : undefined
            }
          >
            {selected !== CUSTOM_KEY && (
              <Pipette className="size-3.5 text-muted-foreground" />
            )}
          </button>

          {selected === CUSTOM_KEY && (
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={customHex}
                onChange={handleColorPickerChange}
                className="size-8 cursor-pointer rounded border border-input bg-transparent p-0.5"
                title="Selecionar cor"
              />
              <input
                type="text"
                value={hexInput}
                onChange={handleHexInputChange}
                placeholder="#6366f1"
                maxLength={7}
                className="h-8 w-24 rounded-md border border-input bg-background px-2 py-1 font-mono text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
