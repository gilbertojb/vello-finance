'use client'

import { AlertCircleIcon, Loader2 } from 'lucide-react'

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

interface ResetPasswordFormProps extends React.ComponentProps<'form'> {
  token: string
  type: string
}

export function ResetPasswordForm({
  token,
  type,
  ...props
}: ResetPasswordFormProps) {
  const [{ errors, message, success }, handleSubmit, isPending] =
    useFormState(resetPassword)

  return (
    <form onSubmit={handleSubmit} {...props}>
      {/* Hidden inputs passam o token para a Server Action */}
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="type" value={type} />

      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Defina sua nova senha
          </h1>
          <p className="text-muted-foreground text-sm text-balance">
            Escolha uma senha com pelo menos 8 caracteres.
          </p>
        </div>

        {success === false && message && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Não foi possível redefinir sua senha</AlertTitle>
            <AlertDescription className="text-xs">
              {message}{' '}
              {message.includes('inválido') && (
                <a href="/forgot-password" className="underline">
                  Solicitar novo link.
                </a>
              )}
            </AlertDescription>
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

        <Field data-invalid={!!errors?.confirm_password}>
          <FieldLabel htmlFor="confirm_password">Confirmar senha</FieldLabel>
          <Input
            id="confirm_password"
            type="password"
            name="confirm_password"
            aria-invalid={!!errors?.confirm_password}
          />
          <FieldError errors={errors?.confirm_password} />
        </Field>

        <Field>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Salvar nova senha'
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
