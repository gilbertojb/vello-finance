import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export function StoreButton({ className, ...props }: ComponentProps<typeof Button>) {
  return <Button className={cn('h-11 rounded-lg', className)} {...props} />
}
