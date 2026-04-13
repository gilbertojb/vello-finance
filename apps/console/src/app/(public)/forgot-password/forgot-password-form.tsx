'use client'

import { AlertCircleIcon, CheckCircle2Icon, Loader2 } from 'lucide-react'

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

export function ForgotPasswordForm({
  ...props
}: React.ComponentProps<'form'>) {
  const [{ errors, message, success }, handleSubmit, isPending] =
    useFormState(requestPasswordReset)

  if (success && message) {
    return (
      <div className="w-full max-w-sm">
        <Alert>
          <CheckCircle2Icon />
          <AlertTitle>E-mail enviado</AlertTitle>
          <AlertDescription className="text-xs">{message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Esqueceu sua senha?
          </h1>
          <p className="text-muted-foreground text-sm text-balance">
            Informe seu e-mail e enviaremos as instruções para redefinir sua
            senha.
          </p>
        </div>

        {success === false && message && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Erro ao processar solicitação</AlertTitle>
            <AlertDescription className="text-xs">{message}</AlertDescription>
          </Alert>
        )}

        <Field data-invalid={!!errors?.email}>
          <FieldLabel htmlFor="email">Seu e-mail</FieldLabel>
          <Input
            id="email"
            type="email"
            name="email"
            aria-invalid={!!errors?.email}
          />
          <FieldError errors={errors?.email} />
        </Field>

        <Field>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Enviar instruções'
            )}
          </Button>
        </Field>

        <p className="text-center text-sm">
          <a
            href="/sign-in"
            className="text-primary hover:text-primary/80 text-xs"
          >
            Voltar para o login
          </a>
        </p>
      </FieldGroup>
    </form>
  )
}
