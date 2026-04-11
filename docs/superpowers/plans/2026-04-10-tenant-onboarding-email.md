# Tenant Onboarding Email — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ao cadastrar um tenant white-label, criar usuário admin no Supabase Auth, enviar email de ativação com link de reset de senha, e permitir reenvio do email.

**Architecture:** Rename `@vello/transactional` → `@vello/email` com nova estrutura de templates (admin/ e console/) e layouts (admin-layout e tenant-layout). A `createTenant` action ganha passos de criação de auth user + envio de email. Nova action `resendWelcomeEmail` para reenvio manual.

**Tech Stack:** React Email, Resend SDK, Supabase Auth Admin API, Next.js Server Actions, Zod

---

## File Structure

```
packages/email/                          ← rename de packages/transactional
├── src/
│   ├── client.ts                        ← NEW: sendEmail() via Resend SDK
│   ├── templates/
│   │   ├── admin/
│   │   │   ├── confirm-email.tsx        ← MOVE de emails/confirm-email.tsx
│   │   │   └── password-recover.tsx     ← MOVE de emails/password-recover.tsx
│   │   └── console/
│   │       └── tenant-welcome.tsx       ← NEW: email de ativação do tenant
│   ├── layouts/
│   │   ├── admin-layout.tsx             ← NEW: layout Vello fixo
│   │   └── tenant-layout.tsx            ← NEW: layout dinâmico por tenant (uso futuro)
│   └── index.ts                         ← MODIFY: re-exports atualizados
├── emails/                              ← preview files para react-email dev
│   ├── confirm-email.tsx                ← MODIFY: preview wrapper
│   ├── password-recover.tsx             ← MODIFY: preview wrapper
│   └── tenant-welcome.tsx               ← NEW: preview wrapper
│   └── static/
│       └── vello-logo.png               ← KEEP
├── package.json                         ← MODIFY: rename + add resend dep
├── tsconfig.json                        ← MODIFY: include templates
├── biome.json                           ← KEEP

packages/env/src/admin.ts                ← MODIFY: add RESEND_API_KEY + CONSOLE_BASE_DOMAIN

supabase/migrations/
└── 20260410000000_add_welcome_email_sent_at.sql  ← NEW

apps/admin/src/app/(private)/tenants/
├── actions.ts                           ← MODIFY: createTenant + resendWelcomeEmail
├── queries.ts                           ← MODIFY: add welcome_email_sent_at + tenant_users
├── _components/
│   ├── tenant-form.tsx                  ← MODIFY: add contact_name field
│   ├── tenant-table.tsx                 ← MODIFY: add "Email pendente" badge
│   └── resend-welcome-button.tsx        ← NEW: botão de reenvio
└── [id]/edit/page.tsx                   ← MODIFY: add resend button section
```

---

### Task 1: Rename package e reestruturar diretórios

**Files:**
- Modify: `packages/transactional/package.json`
- Modify: `packages/transactional/tsconfig.json`
- Create: `packages/email/src/layouts/admin-layout.tsx`
- Create: `packages/email/src/layouts/tenant-layout.tsx`
- Move: `packages/transactional/emails/confirm-email.tsx` → `packages/email/src/templates/admin/confirm-email.tsx`
- Move: `packages/transactional/emails/password-recover.tsx` → `packages/email/src/templates/admin/password-recover.tsx`

- [ ] **Step 1: Renomear diretório e atualizar package.json**

```bash
mv packages/transactional packages/email
```

Editar `packages/email/package.json` — alterar o `name` e adicionar `resend`:

```json
{
  "name": "@vello/email",
  "version": "0.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "dev": "dotenv -e ../../.env -- email dev -p 3001",
    "export": "dotenv -e ../../.env -- email export"
  },
  "devDependencies": {
    "@react-email/preview-server": "5.2.9",
    "@types/node": "^25.3.5",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vello/biome-config": "workspace:*",
    "@vello/typescript-config": "workspace:*",
    "dotenv-cli": "^11.0.0",
    "react-email": "5.2.9"
  },
  "biome": {
    "extends": "@vello/biome-config/react"
  },
  "tsconfig": {
    "extends": "@vello/typescript-config/react-library.json"
  },
  "dependencies": {
    "@react-email/components": "1.0.8",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "resend": "^4.0.0"
  }
}
```

Notas:
- Removido `@vello/env` das dependencies (o package não lê env diretamente — `apiKey` é parâmetro).
- `main` e `types` alterados para `src/index.ts` (sem JSX na re-export).

- [ ] **Step 2: Atualizar tsconfig.json**

Editar `packages/email/tsconfig.json`:

```json
{
  "extends": "@vello/typescript-config/library.json",
  "include": ["src/**/*"],
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

Sem alteração necessária — o include `src/**/*` já cobre a nova estrutura.

- [ ] **Step 3: Criar diretórios e mover templates**

```bash
mkdir -p packages/email/src/templates/admin
mkdir -p packages/email/src/templates/console
mkdir -p packages/email/src/layouts
```

Mover os templates existentes para a nova estrutura. Os arquivos originais em `emails/` viram wrappers de preview:

```bash
cp packages/email/emails/confirm-email.tsx packages/email/src/templates/admin/confirm-email.tsx
cp packages/email/emails/password-recover.tsx packages/email/src/templates/admin/password-recover.tsx
```

- [ ] **Step 4: Adaptar `src/templates/admin/confirm-email.tsx`**

Remover a referência ao `@vello/env/admin` (o `baseUrl` será passado como prop ou fixo):

```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  pixelBasedPreset,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

// biome-ignore lint/correctness/noUnusedImports: React is required for JSX
import * as React from 'react'

interface ConfirmEmailProps {
  verificationCode?: string
  baseUrl?: string
}

export const ConfirmEmail = ({
  verificationCode,
  baseUrl = '',
}: ConfirmEmailProps) => (
  <Html>
    <Head />
    <Tailwind
      config={{
        presets: [pixelBasedPreset],
      }}
    >
      <Body className="bg-white font-sans mx-auto my-0">
        <Preview>Confirme seu email</Preview>
        <Container className="mx-auto my-0 py-0 px-5">
          <Section className="mt-8">
            <Img
              src={`${baseUrl}/static/vello-logo.png`}
              width="120"
              height="32"
              alt="Vello"
            />
          </Section>
          <Heading className="text-neutral-900 text-3xl font-bold my-8 mx-0 p-0 leading-10">
            Confirme seu email
          </Heading>
          <Text className="text-lg mb-7.5">
            Seu código de confirmação está abaixo - insira-o na janela do
            navegador aberta e nós o ajudaremos a fazer login.
          </Text>

          <Section className="bg-neutral-100 rounded mb-7.5 py-10 px-2.5">
            <Text className="text-3xl leading-6 text-center align-middle">
              {verificationCode}
            </Text>
          </Section>

          <Text className="text-neutral-500 text-sm leading-6">
            Se você não solicitou este email, não se preocupe, pode ignorá-lo
            com segurança.
          </Text>

          <Section>
            <Text className="text-xs leading-6 mb-10 text-neutral-400">
              ©2026 Vello - Todos os direitos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)

export default ConfirmEmail
```

- [ ] **Step 5: Adaptar `src/templates/admin/password-recover.tsx`**

Manter o arquivo como está, apenas removendo o `process.env.NEXT_PUBLIC_APP_URL` e usando prop `baseUrl`:

```tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  pixelBasedPreset,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

// biome-ignore lint/correctness/noUnusedImports: React is required for JSX
import * as React from 'react'

interface PasswordRecoverEmailProps {
  recoverLink?: string
  baseUrl?: string
}

export const PasswordRecoverEmail = ({
  recoverLink,
  baseUrl = '',
}: PasswordRecoverEmailProps) => (
  <Html>
    <Head />
    <Tailwind
      config={{
        presets: [pixelBasedPreset],
      }}
    >
      <Body className="bg-white font-sans mx-auto my-0">
        <Preview>Recuperação de Senha</Preview>
        <Container className="mx-auto my-0 py-0 px-5">
          <Section className="mt-8">
            <Img
              src={`${baseUrl}/static/vello-logo.png`}
              width="120"
              height="32"
              alt="Vello"
            />
          </Section>
          <Heading className="text-neutral-900 text-3xl font-bold my-8 mx-0 p-0 leading-10">
            Recuperação de Senha
          </Heading>
          <Text className="text-lg mb-7.5">
            Você solicitou a recuperação da sua senha. Clique no botão abaixo
            para cadastrar uma nova senha:
          </Text>

          <Section className="mb-7.5 py-4">
            <Button
              href={recoverLink}
              className="bg-[#4B64AA] text-white rounded px-6 py-3 text-base font-semibold text-center mt-2 w-full block"
            >
              CADASTRAR NOVA SENHA
            </Button>
          </Section>

          <Text className="text-neutral-600 text-sm leading-6 mb-4">
            Ou copie e cole a URL abaixo em seu navegador:
            <br />
            <Link
              href={recoverLink}
              className="text-blue-600 underline break-all"
            >
              {recoverLink}
            </Link>
          </Text>

          <Text className="text-neutral-500 text-sm leading-6">
            Se você não solicitou esta recuperação, pode ignorar este email com
            segurança. Sua senha não será alterada.
          </Text>

          <Section>
            <Text className="text-xs leading-6 mt-10 text-neutral-400">
              ©2026 Vello - Todos os direitos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)

export default PasswordRecoverEmail
```

- [ ] **Step 6: Atualizar preview wrappers em `emails/`**

Editar `packages/email/emails/confirm-email.tsx`:

```tsx
export { ConfirmEmail as default } from '../src/templates/admin/confirm-email'
```

Editar `packages/email/emails/password-recover.tsx`:

```tsx
export { PasswordRecoverEmail as default } from '../src/templates/admin/password-recover'
```

- [ ] **Step 7: Atualizar referências no monorepo**

Verificar se há imports de `@vello/transactional` em algum lugar e atualizar para `@vello/email`. Buscar:

```bash
grep -r "@vello/transactional" --include="*.ts" --include="*.tsx" --include="*.json" .
```

Atualizar qualquer referência encontrada (provavelmente `turbo.json`, `pnpm-workspace.yaml`). Rodar `pnpm install` para atualizar o lockfile.

- [ ] **Step 8: Commit**

```bash
git add packages/email/
git add -u  # captura os deletes de packages/transactional/
git commit -m "refactor(packages/email): rename @vello/transactional → @vello/email, reorganize templates"
```

---

### Task 2: Criar `client.ts` com `sendEmail()`

**Files:**
- Create: `packages/email/src/client.ts`

- [ ] **Step 1: Criar `packages/email/src/client.ts`**

```typescript
import { Resend } from 'resend'

interface SendEmailOptions {
  to: string
  subject: string
  react: React.ReactElement
  from?: string
  apiKey: string
}

export async function sendEmail(options: SendEmailOptions) {
  const resend = new Resend(options.apiKey)
  return resend.emails.send({
    from: options.from ?? 'Vello Finance <noreply@vellofinance.com.br>',
    to: options.to,
    subject: options.subject,
    react: options.react,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/email/src/client.ts
git commit -m "feat(packages/email): add sendEmail client via Resend SDK"
```

---

### Task 3: Criar layouts `admin-layout.tsx` e `tenant-layout.tsx`

**Files:**
- Create: `packages/email/src/layouts/admin-layout.tsx`
- Create: `packages/email/src/layouts/tenant-layout.tsx`

- [ ] **Step 1: Criar `packages/email/src/layouts/admin-layout.tsx`**

Layout fixo com branding Vello. Usado pelos templates em `templates/admin/` e temporariamente pelo `tenant-welcome.tsx`:

```tsx
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  pixelBasedPreset,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

// biome-ignore lint/correctness/noUnusedImports: React is required for JSX
import * as React from 'react'

interface AdminLayoutProps {
  preview: string
  baseUrl?: string
  children: React.ReactNode
}

export function AdminLayout({ preview, baseUrl = '', children }: AdminLayoutProps) {
  return (
    <Html>
      <Head />
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Body className="bg-white font-sans mx-auto my-0">
          <Preview>{preview}</Preview>
          <Container className="mx-auto my-0 py-0 px-5">
            <Section className="mt-8">
              <Img
                src={`${baseUrl}/static/vello-logo.png`}
                width="120"
                height="32"
                alt="Vello"
              />
            </Section>
            {children}
            <Section>
              <Text className="text-xs leading-6 mt-10 text-neutral-400">
                ©{new Date().getFullYear()} Vello - Todos os direitos reservados.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
```

- [ ] **Step 2: Criar `packages/email/src/layouts/tenant-layout.tsx`**

Layout dinâmico com branding do tenant via props. Usado futuramente por templates em `templates/console/`:

```tsx
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  pixelBasedPreset,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

// biome-ignore lint/correctness/noUnusedImports: React is required for JSX
import * as React from 'react'

interface TenantLayoutProps {
  preview: string
  displayName: string
  logoUrl?: string | null
  primaryColor?: string | null
  children: React.ReactNode
}

const VELLO_LOGO = 'https://admin.vellofinance.com.br/static/vello-logo.png'
const DEFAULT_PRIMARY = '#4B64AA'

export function TenantLayout({
  preview,
  displayName,
  logoUrl,
  primaryColor,
  children,
}: TenantLayoutProps) {
  const logo = logoUrl || VELLO_LOGO
  const color = primaryColor || DEFAULT_PRIMARY

  return (
    <Html>
      <Head />
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Body className="bg-white font-sans mx-auto my-0">
          <Preview>{preview}</Preview>
          <Container className="mx-auto my-0 py-0 px-5">
            <Section className="mt-8">
              <Img src={logo} width="120" height="32" alt={displayName} />
            </Section>
            {children}
            <Section>
              <Text className="text-xs leading-6 mt-10 text-neutral-400">
                ©{new Date().getFullYear()} {displayName} — Todos os direitos reservados.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export { DEFAULT_PRIMARY }
```

- [ ] **Step 3: Commit**

```bash
git add packages/email/src/layouts/
git commit -m "feat(packages/email): add admin-layout and tenant-layout for email templates"
```

---

### Task 4: Criar template `TenantWelcomeEmail`

**Files:**
- Create: `packages/email/src/templates/admin/tenant-welcome.tsx`
- Create: `packages/email/emails/tenant-welcome.tsx` (preview)

- [ ] **Step 1: Criar `packages/email/src/templates/admin/tenant-welcome.tsx`**

```tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  pixelBasedPreset,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

interface TenantWelcomeEmailProps {
  contactName: string
  resetLink: string
  baseUrl?: string
}

export const TenantWelcomeEmail = ({
  contactName,
  resetLink,
  baseUrl = '',
}: TenantWelcomeEmailProps) => (
  <Html>
    <Head />
    <Tailwind
      config={{
        presets: [pixelBasedPreset],
      }}
    >
      <Body className="bg-white font-sans mx-auto my-0">
        <Preview>Bem-vindo à Vello Finance — defina sua senha</Preview>
        <Container className="mx-auto my-0 py-0 px-5">
          <Section className="mt-8">
            <Img
              src={`${baseUrl}/static/vello-logo.png`}
              width="120"
              height="32"
              alt="Vello"
            />
          </Section>
          <Heading className="text-neutral-900 text-3xl font-bold my-8 mx-0 p-0 leading-10">
            Olá, {contactName}
          </Heading>

          <Text className="text-lg mb-7.5">
            Sua conta na Vello Finance foi criada com sucesso. Para começar a
            usar o painel, defina sua senha clicando no botão abaixo.
          </Text>

          <Section className="mb-7.5 py-4">
            <Button
              href={resetLink}
              className="bg-[#4B64AA] text-white rounded px-6 py-3 text-base font-semibold text-center mt-2 w-full block"
            >
              Definir minha senha
            </Button>
          </Section>

          <Text className="text-neutral-600 text-sm leading-6 mb-4">
            Ou copie e cole a URL abaixo no seu navegador:
            <br />
            <Link
              href={resetLink}
              className="text-blue-600 underline break-all"
            >
              {resetLink}
            </Link>
          </Text>

          <Text className="text-neutral-500 text-sm leading-6">
            Se você não esperava este email, pode ignorá-lo com segurança.
          </Text>

          <Section>
            <Text className="text-xs leading-6 mt-10 text-neutral-400">
              ©{new Date().getFullYear()} Vello - Todos os direitos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)

TenantWelcomeEmail.PreviewProps = {
  resetLink: 'https://dash.vellofinance.com.br/reset-password',
  contactName: 'Gilberto Bueno',
  baseUrl: 'http://localhost:3000',
} as TenantWelcomeEmailProps

export default TenantWelcomeEmail

```

- [ ] **Step 2: Criar preview wrapper em `packages/email/emails/tenant-welcome.tsx`**

```tsx
import { TenantWelcomeEmail } from '../src/templates/admin/tenant-welcome'

// biome-ignore lint/correctness/noUnusedImports: React is required for JSX
import * as React from 'react'

export default function TenantWelcomePreview() {
  return (
    <TenantWelcomeEmail
      contactName="João Silva"
      resetLink="https://credito-facil.vellofinance.com.br/reset-password?token=example-token&type=recovery"
    />
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/email/src/templates/admin/tenant-welcome.tsx
git add packages/email/emails/tenant-welcome.tsx
git commit -m "feat(packages/email): add TenantWelcomeEmail template with tenant-layout"
```

---

### Task 5: Atualizar `index.ts` com re-exports

**Files:**
- Modify: `packages/email/src/index.ts` (renomear de `index.tsx`)

- [ ] **Step 1: Reescrever `packages/email/src/index.ts`**

Renomear de `.tsx` para `.ts` (sem JSX neste arquivo):

```bash
mv packages/email/src/index.tsx packages/email/src/index.ts
```

Conteúdo:

```typescript
export { ConfirmEmail } from './templates/admin/confirm-email'
export { PasswordRecoverEmail } from './templates/admin/password-recover'
export { TenantWelcomeEmail } from './templates/admin/tenant-welcome'
export { sendEmail } from './client'
export { AdminLayout } from './layouts/admin-layout'
export { TenantLayout } from './layouts/tenant-layout'
```

- [ ] **Step 2: Atualizar `main` e `types` no package.json se necessário**

Verificar que `package.json` aponta para `src/index.ts` (já feito na Task 1).

- [ ] **Step 3: Commit**

```bash
git add packages/email/src/index.ts
git commit -m "feat(packages/email): update index exports with all templates and client"
```

---

### Task 6: Migration `welcome_email_sent_at`

**Files:**
- Create: `supabase/migrations/20260410000000_add_welcome_email_sent_at.sql`

- [ ] **Step 1: Criar migration**

```sql
-- supabase/migrations/20260410000000_add_welcome_email_sent_at.sql
ALTER TABLE tenants ADD COLUMN welcome_email_sent_at TIMESTAMPTZ;
```

- [ ] **Step 2: Aplicar migration e regenerar types**

```bash
pnpm supabase db push
pnpm db:types
```

Verificar que `packages/database/src/types.ts` agora inclui `welcome_email_sent_at: string | null` na tabela `tenants`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260410000000_add_welcome_email_sent_at.sql
git add packages/database/src/types.ts
git commit -m "feat(database): add welcome_email_sent_at column to tenants"
```

---

### Task 7: Adicionar `RESEND_API_KEY` e `CONSOLE_BASE_DOMAIN` ao env do admin

**Files:**
- Modify: `packages/env/src/admin.ts`

- [ ] **Step 1: Atualizar `packages/env/src/admin.ts`**

```typescript
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    SUPABASE_SECRET_KEY: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    CONSOLE_BASE_DOMAIN: z.string().min(1),
    NODE_ENV: z.enum(['development', 'test', 'production']),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  },
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONSOLE_BASE_DOMAIN: process.env.CONSOLE_BASE_DOMAIN,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
  emptyStringAsUndefined: true,
})
```

- [ ] **Step 2: Adicionar variáveis ao `.env`**

Adicionar ao `.env` (se não existirem):

```
RESEND_API_KEY=re_xxxx
CONSOLE_BASE_DOMAIN=vellofinance.com.br
```

- [ ] **Step 3: Instalar `@vello/email` como dependência do admin**

Adicionar ao `apps/admin/package.json`:

```bash
cd apps/admin && pnpm add @vello/email@workspace:*
```

- [ ] **Step 4: Commit**

```bash
git add packages/env/src/admin.ts apps/admin/package.json pnpm-lock.yaml
git commit -m "feat(env): add RESEND_API_KEY and CONSOLE_BASE_DOMAIN to admin env"
```

---

### Task 8: Adicionar campo `contact_name` ao formulário de tenant

**Files:**
- Modify: `apps/admin/src/app/(private)/tenants/_components/tenant-form.tsx`
- Modify: `apps/admin/src/app/(private)/tenants/actions.ts` (schema only)

- [ ] **Step 1: Adicionar `contact_name` ao schema na action**

Em `apps/admin/src/app/(private)/tenants/actions.ts`, adicionar ao `tenantSchema`:

```typescript
const tenantSchema = z.object({
  name: z.string().min(2).max(100),
  company_name: z.string().min(2).max(150).optional().nullable(),
  cnpj: z.string().optional().nullable(),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  slug: z.string().min(2).max(63).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  custom_domain: z.string().optional().nullable(),
  contact_name: z.string().min(2).max(100).optional().nullable(),
  bank_name: z.string().optional().nullable(),
  bank_agency: z.string().optional().nullable(),
  bank_account: z.string().optional().nullable(),
  bank_pix_key: z.string().optional().nullable(),
})
```

Nota: `contact_name` não é salvo na tabela `tenants` — será usado apenas na criação do auth user e email. O `.insert()` do tenant deve excluí-lo:

Após o `tenantResult.data`, desestruturar para separar:

```typescript
const { contact_name: contactName, ...tenantData } = tenantResult.data
```

E usar `tenantData` (sem `contact_name`) no `.insert()`.

- [ ] **Step 2: Adicionar campo no formulário**

Em `apps/admin/src/app/(private)/tenants/_components/tenant-form.tsx`, adicionar o campo "Nome do Contato" no Card 1 (Dados da Empresa), após o campo de email:

```tsx
<Field>
  <FieldLabel htmlFor="contact_name">Nome do Contato</FieldLabel>
  <Input
    id="contact_name"
    name="contact_name"
    placeholder="Nome da pessoa de contato"
    defaultValue=""
  />
  <FieldError errors={formState.errors?.contact_name} />
</Field>
```

O campo aparece apenas no modo de criação (não em edição, pois o contato já foi registrado). Adicionar condição:

```tsx
{!isEdit && (
  <Field>
    <FieldLabel htmlFor="contact_name">Nome do Contato *</FieldLabel>
    <Input
      id="contact_name"
      name="contact_name"
      required
      placeholder="Nome da pessoa de contato"
    />
    <FieldError errors={formState.errors?.contact_name} />
  </Field>
)}
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/app/(private)/tenants/_components/tenant-form.tsx
git add apps/admin/src/app/(private)/tenants/actions.ts
git commit -m "feat(admin): add contact_name field to tenant creation form"
```

---

### Task 9: Atualizar `createTenant` com criação de auth user e envio de email

**Files:**
- Modify: `apps/admin/src/app/(private)/tenants/actions.ts`

- [ ] **Step 1: Adicionar imports necessários**

No topo de `actions.ts`:

```typescript
import { env } from '@vello/env/admin'
import { sendEmail, TenantWelcomeEmail } from '@vello/email'
```

- [ ] **Step 2: Adicionar fluxo de onboarding após criação do tenant e branding**

Após o bloco de atualização do branding (e antes do `revalidatePath`), adicionar:

```typescript
// ---- Onboarding: criar auth user + enviar email ----

const contactName = tenantResult.data.contact_name ?? tenantResult.data.name

// 5.2 — Criar usuário no Supabase Auth
const tempPassword = crypto.randomUUID()
const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
  email: tenantResult.data.email,
  password: tempPassword,
  email_confirm: true,
})

if (authError) {
  return {
    success: false,
    message: `Parceiro cadastrado, mas erro ao criar acesso: ${authError.message}`,
    errors: null,
  }
}

// 5.3 — Inserir em tenant_users
await serviceClient
  .from('tenant_users')
  .insert({
    id: authUser.user.id,
    tenant_id: tenant.id,
    role: 'tenant_admin',
    full_name: contactName,
  })

// 5.4 — Gerar link de recovery
const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
  type: 'recovery',
  email: tenantResult.data.email,
})

if (linkError || !linkData) {
  revalidatePath('/tenants')
  return {
    success: true,
    message: 'Parceiro cadastrado, mas o email de ativação não pôde ser gerado.',
    errors: null,
  }
}

// 5.5 — Construir URL de reset
const domain = tenantResult.data.custom_domain
  ?? `${tenantResult.data.slug}.${env.CONSOLE_BASE_DOMAIN}`
const resetUrl = `https://${domain}/reset-password?token=${linkData.properties.hashed_token}&type=recovery`

// 5.6 — Buscar branding para o email
const { data: brandingData } = await serviceClient
  .from('tenant_branding')
  .select('logo_url, company_display_name, theme_color')
  .eq('tenant_id', tenant.id)
  .single()

const displayName = brandingData?.company_display_name ?? tenantResult.data.name

// 5.7 — Enviar email
const { error: emailError } = await sendEmail({
  apiKey: env.RESEND_API_KEY,
  to: tenantResult.data.email,
  subject: 'Bem-vindo à Vello Finance — defina sua senha',
  react: TenantWelcomeEmail({
    contactName,
    displayName,
    resetLink: resetUrl,
    logoUrl: brandingData?.logo_url,
    primaryColor: brandingData?.theme_color,
  }),
})

// 5.8 — Atualizar welcome_email_sent_at
if (!emailError) {
  await supabase
    .from('tenants')
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq('id', tenant.id)
}
```

- [ ] **Step 3: Ajustar retorno para incluir aviso de email**

Substituir o retorno de sucesso final:

```typescript
revalidatePath('/tenants')

if (emailError) {
  return {
    success: true,
    message: 'Parceiro cadastrado, mas o email de ativação não pôde ser enviado.',
    errors: null,
  }
}

return {
  success: true,
  message: 'Parceiro cadastrado com sucesso!',
  errors: null,
}
```

- [ ] **Step 4: Ajustar desestruturação para excluir `contact_name` do insert**

Alterar a linha do insert do tenant para não incluir `contact_name`:

```typescript
const { contact_name: _contactNameField, ...tenantData } = tenantResult.data

const { data: tenant, error: tenantError } = await supabase
  .from('tenants')
  .insert({
    ...tenantData,
    type: 'whitelabel',
    status: 'pending',
  })
  .select('id')
  .single()
```

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/app/(private)/tenants/actions.ts
git commit -m "feat(admin): integrate auth user creation and welcome email in createTenant"
```

---

### Task 10: Criar action `resendWelcomeEmail`

**Files:**
- Modify: `apps/admin/src/app/(private)/tenants/actions.ts`

- [ ] **Step 1: Adicionar `resendWelcomeEmail` action**

No final de `actions.ts`:

```typescript
// ---------------------------------------------------------------------------
// resendWelcomeEmail
// ---------------------------------------------------------------------------

export async function resendWelcomeEmail(tenantId: string) {
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  // 1. Buscar tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, email, slug, custom_domain, name')
    .eq('id', tenantId)
    .single()

  if (tenantError || !tenant) {
    return { success: false, message: 'Parceiro não encontrado.' }
  }

  // 2. Buscar branding
  const { data: branding } = await serviceClient
    .from('tenant_branding')
    .select('logo_url, company_display_name, theme_color')
    .eq('tenant_id', tenantId)
    .single()

  // 3. Buscar tenant_user admin para obter full_name
  const { data: tenantUser } = await serviceClient
    .from('tenant_users')
    .select('id, full_name')
    .eq('tenant_id', tenantId)
    .eq('role', 'tenant_admin')
    .limit(1)
    .single()

  const contactName = tenantUser?.full_name ?? tenant.name

  // 4. Gerar novo link de recovery
  const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
    type: 'recovery',
    email: tenant.email,
  })

  if (linkError || !linkData) {
    return { success: false, message: 'Erro ao gerar link de recuperação.' }
  }

  // 5. Construir URL de reset
  const domain = tenant.custom_domain
    ?? `${tenant.slug}.${env.CONSOLE_BASE_DOMAIN}`
  const resetUrl = `https://${domain}/reset-password?token=${linkData.properties.hashed_token}&type=recovery`

  const displayName = branding?.company_display_name ?? tenant.name

  // 6. Enviar email
  const { error: emailError } = await sendEmail({
    apiKey: env.RESEND_API_KEY,
    to: tenant.email,
    subject: 'Bem-vindo à Vello Finance — defina sua senha',
    react: TenantWelcomeEmail({
      contactName,
      displayName,
      resetLink: resetUrl,
      logoUrl: branding?.logo_url,
      primaryColor: branding?.theme_color,
    }),
  })

  if (emailError) {
    return { success: false, message: 'Erro ao enviar email de ativação.' }
  }

  // 7. Atualizar welcome_email_sent_at
  await supabase
    .from('tenants')
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq('id', tenantId)

  revalidatePath(`/tenants/${tenantId}/edit`)
  revalidatePath('/tenants')

  return { success: true, message: 'Email de ativação reenviado com sucesso!' }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/(private)/tenants/actions.ts
git commit -m "feat(admin): add resendWelcomeEmail action for re-sending activation email"
```

---

### Task 11: UI para reenvio na página de edição

**Files:**
- Create: `apps/admin/src/app/(private)/tenants/_components/resend-welcome-button.tsx`
- Modify: `apps/admin/src/app/(private)/tenants/[id]/edit/page.tsx`
- Modify: `apps/admin/src/app/(private)/tenants/queries.ts`

- [ ] **Step 1: Atualizar query `getTenant` para incluir `welcome_email_sent_at`**

Em `queries.ts`, a query já usa `select('*')` — `welcome_email_sent_at` virá automaticamente após a migration. Nenhuma alteração necessária na query.

Atualizar `listTenants` para incluir `welcome_email_sent_at`:

```typescript
export async function listTenants() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('id, name, slug, status, created_at, welcome_email_sent_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
```

- [ ] **Step 2: Criar componente `ResendWelcomeButton`**

Criar `apps/admin/src/app/(private)/tenants/_components/resend-welcome-button.tsx`:

```tsx
'use client'

import { Loader2, Mail } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { resendWelcomeEmail } from '../actions'

interface ResendWelcomeButtonProps {
  tenantId: string
  welcomeEmailSentAt: string | null
}

export function ResendWelcomeButton({
  tenantId,
  welcomeEmailSentAt,
}: ResendWelcomeButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleResend() {
    startTransition(async () => {
      const result = await resendWelcomeEmail(tenantId)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={handleResend}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Mail className="size-4" />
        )}
        Reenviar email de ativação
      </Button>
      <span className="text-xs text-muted-foreground">
        {welcomeEmailSentAt
          ? `Enviado em ${new Date(welcomeEmailSentAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
          : 'Email não enviado'}
      </span>
    </div>
  )
}
```

- [ ] **Step 3: Adicionar botão na página de edição**

Em `apps/admin/src/app/(private)/tenants/[id]/edit/page.tsx`, importar e renderizar o componente:

```tsx
import { notFound } from 'next/navigation'

import { ResendWelcomeButton } from '../../_components/resend-welcome-button'
import { TenantForm } from '../../_components/tenant-form'
import { TenantStatusBadge } from '../../_components/tenant-status-badge'

import { getTenant } from '../../queries'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const tenant = await getTenant(id).catch(() => null)
  return { title: tenant ? `Editar ${tenant.name}` : 'Editar Parceiro' }
}

export default async function EditTenantPage({ params }: Props) {
  const { id } = await params
  const tenant = await getTenant(id).catch(() => null)

  if (!tenant) notFound()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold tracking-tight">
                {tenant.name}
              </h2>
              <TenantStatusBadge status={tenant.status} />
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              {tenant.custom_domain || `${tenant.slug}.vellofinance.com.br`}
            </p>
          </div>
        </div>
        <ResendWelcomeButton
          tenantId={tenant.id}
          welcomeEmailSentAt={tenant.welcome_email_sent_at}
        />
      </div>

      <div className="pt-2">
        <TenantForm tenant={tenant} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/app/(private)/tenants/_components/resend-welcome-button.tsx
git add apps/admin/src/app/(private)/tenants/[id]/edit/page.tsx
git add apps/admin/src/app/(private)/tenants/queries.ts
git commit -m "feat(admin): add resend welcome email button to tenant edit page"
```

---

### Task 12: Badge "Email pendente" na listagem de tenants

**Files:**
- Modify: `apps/admin/src/app/(private)/tenants/_components/tenant-table.tsx`

- [ ] **Step 1: Atualizar tipo `TenantRow` e adicionar badge**

Em `tenant-table.tsx`, adicionar `welcome_email_sent_at` ao tipo e renderizar badge:

Atualizar o tipo:

```typescript
type TenantRow = {
  id: string
  name: string
  slug: string
  status: string
  created_at: string
  welcome_email_sent_at: string | null
}
```

Adicionar badge condicional na coluna de status, após o `TenantStatusBadge`:

```tsx
<td className="p-4 align-middle">
  <div className="flex items-center gap-2">
    <TenantStatusBadge status={tenant.status} />
    {!tenant.welcome_email_sent_at && tenant.status === 'pending' && (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
        Email pendente
      </span>
    )}
  </div>
</td>
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/(private)/tenants/_components/tenant-table.tsx
git commit -m "feat(admin): show 'Email pendente' badge on tenant list for pending tenants"
```

---

### Task 13: Atualizar CLAUDE.md e documentação

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Atualizar referência do package no CLAUDE.md**

Substituir `packages/transactional` por `packages/email` na seção de packages:

```markdown
### `packages/email` (renomeado de `packages/transactional`)
Templates React Email (admin/ e console/) + envio via Resend.

```
packages/email/src/
├── client.ts                    ← sendEmail() via Resend SDK
├── templates/
│   ├── admin/                   ← Emails do backoffice (branding Vello fixo)
│   │   ├── confirm-email.tsx
│   │   └── password-recover.tsx
│   └── console/                 ← Emails do tenant (branding dinâmico)
│       └── tenant-welcome.tsx
├── layouts/
│   ├── admin-layout.tsx         ← Logo Vello, cores fixas, footer "© Vello Finance"
│   └── tenant-layout.tsx        ← Props: logoUrl, primaryColor, displayName
└── index.ts                     ← Re-exports de templates + sendEmail
```
```

Atualizar também a tabela de stack:

```markdown
| Emails | Resend + React Email (`packages/email`) |
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with packages/email rename and structure"
```

---

### Task 14: Instalar dependências e verificar build

- [ ] **Step 1: Instalar dependências**

```bash
pnpm install
```

- [ ] **Step 2: Verificar build do package email**

```bash
cd packages/email && pnpm exec tsc --noEmit
```

- [ ] **Step 3: Verificar build do admin**

```bash
cd apps/admin && pnpm exec next build
```

Se houver erros, corrigir antes de prosseguir.

- [ ] **Step 4: Commit final (se houve ajustes)**

```bash
git add .
git commit -m "chore: fix build issues after tenant onboarding email integration"
```
