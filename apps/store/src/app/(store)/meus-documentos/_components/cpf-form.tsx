'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { InputMask } from '@react-input/mask'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { validateCpfAction } from '@/app/(store)/meus-documentos/actions'

export function CpfForm() {
  const [cpf, setCpf] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('cpf', cpf)
    startTransition(async () => {
      const result = await validateCpfAction(fd)
      if (result?.error) toast.error(result.error)
      else router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="cpf" className="text-sm font-medium text-foreground">
          CPF
        </label>
        <InputMask
          component={Input}
          mask="___.___.___-__"
          replacement={{ _: /\d/ }}
          id="cpf"
          name="cpf"
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(e.currentTarget.value)}
          autoComplete="off"
          required
        />
      </div>
      <Button type="submit" disabled={pending || cpf.replace(/\D/g, '').length !== 11}>
        {pending ? 'Validando…' : 'Continuar'}
      </Button>
      <p className="text-xs text-muted-foreground">
        Suas informações são protegidas.
      </p>
    </form>
  )
}
