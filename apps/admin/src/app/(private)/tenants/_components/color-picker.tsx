'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'

interface ColorPickerProps {
  name: string
  defaultValue?: string
  label?: string
}

export function ColorPicker({ name, defaultValue = '#000000', label }: ColorPickerProps) {
  const [color, setColor] = useState(defaultValue)

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="h-10 w-10 cursor-pointer rounded-md border border-input bg-background p-1"
        aria-label={label}
      />
      <Input
        type="text"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        maxLength={7}
        className="w-28 font-mono text-sm"
        placeholder="#000000"
      />
      <input type="hidden" name={name} value={color} />
    </div>
  )
}
