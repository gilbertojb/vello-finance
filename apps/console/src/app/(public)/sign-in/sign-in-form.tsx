'use client'

import { AlertCircleIcon, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useFormState } from '@/hooks/use-form-state'
import { signInWithEmailAndPassword } from './actions'

export function SignInForm({ ...props }: React.ComponentProps<'form'>) {
  const router = useRouter()

  const [{ errors, message, success }, handleSubmit, isPending] = useFormState(
    signInWithEmailAndPassword,
    () => router.push('/'),
  )

  return (
    <form onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold text-foreground">Acesse sua conta</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Insira seus dados abaixo para acessar sua conta
          </p>
        </div>

        {success === false && message && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Erro ao entrar!</AlertTitle>
            <AlertDescription className="text-xs">{message}</AlertDescription>
          </Alert>
        )}

        <Field data-invalid={!!errors?.email}>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            type="email"
            name="email"
            aria-invalid={!!errors?.email}
          />
          <FieldError errors={errors?.email} />
        </Field>

        <Field data-invalid={!!errors?.password}>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <Input
            id="password"
            type="password"
            name="password"
            aria-invalid={!!errors?.password}
          />
          <FieldError errors={errors?.password} />
        </Field>

        <Field>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Entrar'}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
