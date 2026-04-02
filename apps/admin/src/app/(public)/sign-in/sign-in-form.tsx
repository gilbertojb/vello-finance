'use client'

import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export function SignInForm({ ...props }: React.ComponentProps<'form'>) {
  return (
    <form {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Acesse sua conta</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Insira seus dados abaixo para acessar sua conta
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="email">Informe seu e-mail</FieldLabel>
          <Input id="email" type="email" name="email" />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Informe sua senha</FieldLabel>
            <a
              href="/forgot-password"
              className="ml-auto text-xs text-primary hover:text-primary/80"
            >
              Esqueceu sua senha?
            </a>
          </div>
          <Input id="password" type="password" name="password" />
        </Field>
        <Field>
          <Button type="submit">Continuar</Button>
        </Field>

        <div className="text-center text-sm">
          Ainda não tem uma conta?{' '}
          <a href="/sign-up" className="text-primary hover:text-primary/80">
            Crie sua conta agora
          </a>
        </div>
      </FieldGroup>
    </form>
  )
}
