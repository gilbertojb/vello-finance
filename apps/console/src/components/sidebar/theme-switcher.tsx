'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <ToggleGroup
      type="single"
      aria-label="Toggle theme"
      size="sm"
      value={theme ?? 'system'}
      onValueChange={(v) => v && setTheme(v)}
      variant="outline"
      className="w-full"
    >
      <ToggleGroupItem value="light" className="flex-1">
        <Sun className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" className="flex-1">
        <Moon className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="system" className="flex-1">
        <Monitor className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
