'use client'

import { AlertCircleIcon, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { useFormState } from '@/hooks/use-form-state'

import { resetPassword } from './actions'

export function ResetPasswordForm({ ...props }: React.ComponentProps<'form'>) {
  const router = useRouter()

  const [{ errors, message, success }, handleSubmit, isPending] = useFormState(
    resetPassword,
    () => {
      // Auto-login: a sessão já está ativa (estabelecida pelo exchangeCodeForSession).
      // Redireciona para o dashboard.
      router.push('/')
    },
  )

  return (
    <form onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Redefinir senha</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Informe sua nova senha abaixo
          </p>
        </div>

        {success === false && message && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription className="text-xs">{message}</AlertDescription>
          </Alert>
        )}

        <Field data-invalid={!!errors?.password}>
          <FieldLabel htmlFor="password">Nova senha</FieldLabel>
          <Input
            id="password"
            type="password"
            name="password"
            aria-invalid={!!errors?.password}
          />
          <FieldError errors={errors?.password} />
        </Field>

        <Field data-invalid={!!errors?.password_confirmation}>
          <FieldLabel htmlFor="password_confirmation">
            Confirme a nova senha
          </FieldLabel>
          <Input
            id="password_confirmation"
            type="password"
            name="password_confirmation"
            aria-invalid={!!errors?.password_confirmation}
          />
          <FieldError errors={errors?.password_confirmation} />
        </Field>

        <Field>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Redefinir senha'
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
