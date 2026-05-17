'use client'

import { AlertCircleIcon, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'

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

import { requestPasswordReset } from './actions'

export function ForgotPasswordForm({ ...props }: React.ComponentProps<'form'>) {
  const [{ errors, message, success }, handleSubmit, isPending] = useFormState(
    requestPasswordReset,
  )

  return (
    <form onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Esqueceu sua senha?</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Informe seu e-mail para receber um link de recuperação
          </p>
        </div>

        {success && message && (
          <Alert variant="success">
            <CheckCircle2 />
            <AlertTitle>E-mail enviado</AlertTitle>
            <AlertDescription className="text-xs">{message}</AlertDescription>
          </Alert>
        )}

        {success === false && message && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription className="text-xs">{message}</AlertDescription>
          </Alert>
        )}

        {!success && (
          <>
            <Field data-invalid={!!errors?.email}>
              <FieldLabel htmlFor="email">Informe seu e-mail</FieldLabel>
              <Input
                id="email"
                type="email"
                name="email"
                aria-invalid={!!errors?.email}
              />
              <FieldError errors={errors?.email} />
            </Field>

            <Field>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Enviar link de recuperação'
                )}
              </Button>
            </Field>
          </>
        )}

        <div className="text-center text-sm">
          <Link
            href="/sign-in"
            className="text-primary hover:text-primary/80 underline underline-offset-4"
          >
            Voltar para o login
          </Link>
        </div>
      </FieldGroup>
    </form>
  )
}
