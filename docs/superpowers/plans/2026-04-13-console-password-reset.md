# Console Password Reset — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar as páginas `/forgot-password` e `/reset-password` no `apps/console`, com e-mail de recovery enviado via Resend usando template com branding do tenant.

**Architecture:** Segue o padrão do console — Server Component page → Client Component form → Server Action + `useFormState`. Toda operação de Auth ocorre no servidor. O fluxo de recovery usa `admin.generateLink` (service client) para gerar o token e `verifyOtp` + `updateUser` para confirmar a troca de senha.

**Tech Stack:** Next.js 15 App Router, Supabase SSR (`@supabase/ssr`), `@vello/email` (Resend + React Email), `@vello/env/console`, Zod.

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `packages/env/src/console.ts` | Modificar | Adicionar `RESEND_API_KEY` |
| `packages/email/src/templates/console/tenant-password-recovery.tsx` | Criar | Template de e-mail de recovery |
| `packages/email/src/index.ts` | Modificar | Re-export do novo template |
| `apps/console/src/app/(public)/forgot-password/page.tsx` | Criar | Server Component da página |
| `apps/console/src/app/(public)/forgot-password/forgot-password-form.tsx` | Criar | Client Component do formulário |
| `apps/console/src/app/(public)/forgot-password/actions.ts` | Criar | Server Action: gera link + envia e-mail |
| `apps/console/src/app/(public)/reset-password/page.tsx` | Criar | Server Component: lê searchParams, trata token ausente |
| `apps/console/src/app/(public)/reset-password/reset-password-form.tsx` | Criar | Client Component do formulário |
| `apps/console/src/app/(public)/reset-password/actions.ts` | Criar | Server Action: verifyOtp + updateUser + redirect |

---

## Task 1: Adicionar RESEND_API_KEY ao env do console

**Files:**
- Modify: `packages/env/src/console.ts`

- [ ] **Abrir `packages/env/src/console.ts`** e adicionar `RESEND_API_KEY` ao bloco `server` e `runtimeEnv`:

```typescript
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'
import { sharedClient, sharedRuntimeEnv, sharedServer } from './shared'

export const env = createEnv({
  server: {
    ...sharedServer,
    CONSOLE_BASE_DOMAIN: z.string().min(1),
    NODE_ENV: z.enum(['development', 'test', 'production']),
    RESEND_API_KEY: z.string().min(1),
  },
  client: {
    ...sharedClient,
  },
  runtimeEnv: {
    ...sharedRuntimeEnv,
    CONSOLE_BASE_DOMAIN: process.env.CONSOLE_BASE_DOMAIN,
    NODE_ENV: process.env.NODE_ENV,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
  emptyStringAsUndefined: true,
})
```

- [ ] **Commit:**

```bash
git add packages/env/src/console.ts
git commit -m "feat(console): add RESEND_API_KEY to console env"
```

---

## Task 2: Criar template de e-mail de recovery para tenant

**Files:**
- Create: `packages/email/src/templates/console/tenant-password-recovery.tsx`
- Modify: `packages/email/src/index.ts`

- [ ] **Criar `packages/email/src/templates/console/tenant-password-recovery.tsx`:**

```typescript
import { Button, Heading, Link, Section, Text } from '@react-email/components'

import { DEFAULT_PRIMARY, TenantLayout } from '../../layouts/tenant-layout'

interface TenantPasswordRecoveryEmailProps {
  resetLink: string
  displayName?: string
  logoUrl?: string | null
  primaryColor?: string | null
}

export function TenantPasswordRecoveryEmail({
  resetLink,
  displayName = 'Vello Finance',
  logoUrl,
  primaryColor,
}: TenantPasswordRecoveryEmailProps) {
  const color = primaryColor || DEFAULT_PRIMARY

  return (
    <TenantLayout
      preview="Recuperação de senha"
      displayName={displayName}
      logoUrl={logoUrl}
      primaryColor={color}
    >
      <Heading className="text-neutral-900 text-3xl font-bold my-8 mx-0 p-0 leading-10">
        Recuperação de senha
      </Heading>

      <Text className="text-lg mb-7.5">
        Você solicitou a recuperação da sua senha. Clique no botão abaixo para
        cadastrar uma nova senha:
      </Text>

      <Section className="mb-7.5 py-4">
        <Button
          href={resetLink}
          style={{ backgroundColor: color }}
          className="text-white rounded px-6 py-3 text-base font-semibold text-center mt-2 w-full block"
        >
          Cadastrar nova senha
        </Button>
      </Section>

      <Text className="text-neutral-600 text-sm leading-6 mb-4">
        Ou copie e cole a URL abaixo no seu navegador:
        <br />
        <Link href={resetLink} className="text-blue-600 underline break-all">
          {resetLink}
        </Link>
      </Text>

      <Text className="text-neutral-500 text-sm leading-6">
        Se você não solicitou esta recuperação, pode ignorar este e-mail com
        segurança. Sua senha não será alterada.
      </Text>
    </TenantLayout>
  )
}

TenantPasswordRecoveryEmail.PreviewProps = {
  resetLink: 'https://exemplo.vellofinance.com.br/reset-password?token=abc&type=recovery',
  displayName: 'Vello Finance',
} as TenantPasswordRecoveryEmailProps

export default TenantPasswordRecoveryEmail
```

- [ ] **Editar `packages/email/src/index.ts`** para adicionar o re-export:

```typescript
export { sendEmail } from './client'

export { AdminLayout } from './layouts/admin-layout'
export { TenantLayout } from './layouts/tenant-layout'

export { ConfirmEmail } from './templates/admin/confirm-email'
export { PasswordRecoverEmail } from './templates/admin/password-recover'
export { TenantWelcomeEmail } from './templates/admin/tenant-welcome'
export { TenantPasswordRecoveryEmail } from './templates/console/tenant-password-recovery'
```

- [ ] **Commit:**

```bash
git add packages/email/src/templates/console/tenant-password-recovery.tsx packages/email/src/index.ts
git commit -m "feat(email): add TenantPasswordRecoveryEmail template"
```

---

## Task 3: Criar Server Action de forgot-password

**Files:**
- Create: `apps/console/src/app/(public)/forgot-password/actions.ts`

- [ ] **Criar `apps/console/src/app/(public)/forgot-password/actions.ts`:**

```typescript
'use server'

import { sendEmail, TenantPasswordRecoveryEmail } from '@vello/email'
import { env } from '@vello/env/console'
import { headers } from 'next/headers'
import { z } from 'zod'

import { createServiceClient } from '@/lib/supabase/service'

const forgotPasswordSchema = z.object({
  email: z.email({ message: 'Por favor, informe um e-mail válido.' }),
})

// Mensagem genérica — não revela se o e-mail existe ou não (evita enumeração de usuários)
const SUCCESS_MESSAGE =
  'Se esse e-mail estiver cadastrado, você receberá as instruções em breve.'

export async function requestPasswordReset(data: FormData) {
  const result = forgotPasswordSchema.safeParse(Object.fromEntries(data))

  if (!result.success) {
    return {
      success: false,
      message: null,
      errors: z.flattenError(result.error).fieldErrors,
    }
  }

  const { email } = result.data

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id') ?? ''
  const host = headerStore.get('host') ?? ''

  const serviceClient = createServiceClient()

  // Gerar link de recovery — falha silenciosamente se o e-mail não existe no Auth
  const { data: linkData, error: linkError } =
    await serviceClient.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

  if (linkError || !linkData) {
    return { success: true, message: SUCCESS_MESSAGE, errors: null }
  }

  // Verificar que o usuário pertence ao tenant atual (isolamento multi-tenant)
  const { data: tenantUser } = await serviceClient
    .from('tenant_users')
    .select('id')
    .eq('id', linkData.user.id)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (!tenantUser) {
    return { success: true, message: SUCCESS_MESSAGE, errors: null }
  }

  const resetUrl = `https://${host}/reset-password?token=${linkData.properties.hashed_token}&type=recovery`

  await sendEmail({
    apiKey: env.RESEND_API_KEY,
    to: email,
    subject: 'Recuperação de senha',
    react: TenantPasswordRecoveryEmail({ resetLink: resetUrl }),
  })

  return { success: true, message: SUCCESS_MESSAGE, errors: null }
}
```

- [ ] **Commit:**

```bash
git add apps/console/src/app/\(public\)/forgot-password/actions.ts
git commit -m "feat(console): add forgot-password server action"
```

---

## Task 4: Criar form e página de forgot-password

**Files:**
- Create: `apps/console/src/app/(public)/forgot-password/forgot-password-form.tsx`
- Create: `apps/console/src/app/(public)/forgot-password/page.tsx`

- [ ] **Criar `apps/console/src/app/(public)/forgot-password/forgot-password-form.tsx`:**

```typescript
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
```

- [ ] **Criar `apps/console/src/app/(public)/forgot-password/page.tsx`:**

```typescript
import type { Metadata } from 'next'
import { ForgotPasswordForm } from './forgot-password-form'

export const metadata: Metadata = { title: 'Esqueceu sua senha?' }

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm className="w-full max-w-sm" />
}
```

- [ ] **Commit:**

```bash
git add apps/console/src/app/\(public\)/forgot-password/
git commit -m "feat(console): add forgot-password page and form"
```

---

## Task 5: Criar Server Action de reset-password

**Files:**
- Create: `apps/console/src/app/(public)/reset-password/actions.ts`

- [ ] **Criar `apps/console/src/app/(public)/reset-password/actions.ts`:**

```typescript
'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    type: z.literal('recovery'),
    password: z
      .string()
      .min(8, { message: 'A senha deve ter no mínimo 8 caracteres.' }),
    confirm_password: z.string().min(1, { message: 'Confirme sua senha.' }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'As senhas não coincidem.',
    path: ['confirm_password'],
  })

export async function resetPassword(data: FormData) {
  const result = resetPasswordSchema.safeParse(Object.fromEntries(data))

  if (!result.success) {
    return {
      success: false,
      message: null,
      errors: z.flattenError(result.error).fieldErrors,
    }
  }

  const { token, type, password } = result.data

  const supabase = await createClient()

  const { error: otpError } = await supabase.auth.verifyOtp({
    token_hash: token,
    type,
  })

  if (otpError) {
    return {
      success: false,
      message: 'Link inválido ou expirado. Solicite um novo.',
      errors: null,
    }
  }

  const { error: updateError } = await supabase.auth.updateUser({ password })

  if (updateError) {
    return {
      success: false,
      message: updateError.message,
      errors: null,
    }
  }

  redirect('/')
}
```

- [ ] **Commit:**

```bash
git add apps/console/src/app/\(public\)/reset-password/actions.ts
git commit -m "feat(console): add reset-password server action"
```

---

## Task 6: Criar form e página de reset-password

**Files:**
- Create: `apps/console/src/app/(public)/reset-password/reset-password-form.tsx`
- Create: `apps/console/src/app/(public)/reset-password/page.tsx`

- [ ] **Criar `apps/console/src/app/(public)/reset-password/reset-password-form.tsx`:**

```typescript
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
```

- [ ] **Criar `apps/console/src/app/(public)/reset-password/page.tsx`:**

```typescript
import type { Metadata } from 'next'
import Link from 'next/link'

import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = { title: 'Redefinir senha' }

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string; type?: string }>
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token, type } = await searchParams

  if (!token || type !== 'recovery') {
    return (
      <div className="w-full max-w-sm flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Link inválido ou expirado
        </h1>
        <p className="text-muted-foreground text-sm text-balance">
          Este link de redefinição de senha não é válido ou já expirou.
        </p>
        <Link
          href="/forgot-password"
          className="text-primary hover:text-primary/80 text-sm underline"
        >
          Solicitar novo link
        </Link>
      </div>
    )
  }

  return (
    <ResetPasswordForm token={token} type={type} className="w-full max-w-sm" />
  )
}
```

- [ ] **Commit:**

```bash
git add apps/console/src/app/\(public\)/reset-password/
git commit -m "feat(console): add reset-password page and form"
```

---

## Verificação manual após implementação

1. Cadastrar um novo tenant pelo admin → link de boas-vindas chega no e-mail → clicar → `/reset-password` abre com o form → salvar senha → redireciona para `/`
2. Fazer logout → `/sign-in` → clicar "Esqueceu sua senha?" → `/forgot-password` → inserir e-mail → e-mail de recovery chega → clicar no link → `/reset-password` abre → salvar nova senha → redireciona para `/`
3. Acessar `/reset-password` sem query params → exibe estado de erro com link para `/forgot-password`
4. Usar um token expirado/inválido → erro inline com link para `/forgot-password`
5. Inserir senhas diferentes no form → erro de validação inline em `confirm_password`
