import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { Input } from './input'

export function StoreInput({ className, ...props }: ComponentProps<typeof Input>) {
  return (
    <Input
      className={cn(
        'h-11 rounded-lg bg-white px-4 text-sm text-surface-foreground',
        'border-surface-foreground/15',
        'placeholder:text-surface-foreground/35',
        'focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20',
        'focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20',
        className,
      )}
      {...props}
    />
  )
}
