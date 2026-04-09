import * as React from 'react'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface ColorSwatchOption {
  value: string
  label: string
  color?: string // HEX or valid CSS color (optional fallback)
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
}

export function ColorSwatchPicker({
  name,
  options,
  defaultValue = '',
  className,
  ...props
}: ColorSwatchPickerProps) {
  const [selectedValue, setSelectedValue] = React.useState(defaultValue)

  const handleSelect = (value: string) => {
    setSelectedValue(value)
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)} {...props}>
      <input type="hidden" name={name} value={selectedValue} />
      {options.map((opt) => {
        const isSelected = selectedValue === opt.value
        const isDefault = opt.value === ''

        return (
          <button
            key={opt.value}
            type="button"
            title={opt.label}
            onClick={() => handleSelect(opt.value)}
            className={cn(
              'relative flex items-center justify-center rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background',
              'size-8 border',
              isSelected &&
                'ring-2 ring-primary ring-offset-2 ring-offset-background',
              isDefault && 'bg-muted',
              opt.className,
            )}
            style={opt.color ? { backgroundColor: opt.color } : undefined}
          ></button>
        )
      })}
    </div>
  )
}
