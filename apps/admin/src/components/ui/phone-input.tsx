'use client'

import { InputMask } from '@react-input/mask'
import { type ComponentProps } from 'react'

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
