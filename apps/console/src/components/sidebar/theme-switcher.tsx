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
      defaultValue={theme}
      variant="outline"
      className="w-full"
    >
      <ToggleGroupItem
        value="light"
        onClick={() => setTheme('light')}
        className="flex-1"
      >
        <Sun className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="dark"
        onClick={() => setTheme('dark')}
        className="flex-1"
      >
        <Moon className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="system"
        onClick={() => setTheme('system')}
        className="flex-1"
      >
        <Monitor className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
