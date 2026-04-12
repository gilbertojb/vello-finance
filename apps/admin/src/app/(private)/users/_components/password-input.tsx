'use client'

import { RefreshCw } from 'lucide-react'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function generatePassword(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*'
  const array = new Uint32Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (v) => chars[v % chars.length]).join('')
}

type Props = {
  isEdit: boolean
}

export function PasswordInput({ isEdit }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleGenerate() {
    const password = generatePassword()
    if (inputRef.current) {
      // Set via native setter to trigger React's change tracking for form data
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )?.set
      nativeInputValueSetter?.call(inputRef.current, password)
      inputRef.current.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        ref={inputRef}
        id="password"
        name="password"
        type="text"
        required={!isEdit}
        placeholder={isEdit ? 'Deixe vazio para manter a atual' : 'Mínimo 8 caracteres'}
        minLength={isEdit ? undefined : 8}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleGenerate}
        title="Gerar senha aleatória"
        className="shrink-0"
      >
        <RefreshCw className="size-4" />
      </Button>
    </div>
  )
}
