import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { Input } from './input'

export function StoreInput({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input className={cn('h-11 rounded-lg', className)} {...props} />
}
