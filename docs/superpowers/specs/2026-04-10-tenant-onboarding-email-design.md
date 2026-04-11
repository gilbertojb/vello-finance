# Spec: Onboarding de Tenant White-Label

**Data:** 2026-04-10
**Apps afetados:** `apps/admin`, `packages/email` (rename de `packages/transactional`)
**Status:** aprovado
**Escopo:** Ao cadastrar um tenant white-label, criar usuário admin no Supabase Auth, enviar email de ativação com link de reset de senha, e permitir reenvio do email.

---

## Contexto

Atualmente o `createTenant` no admin apenas insere o registro na tabela `tenants` e o branding. Não cria usuário no Supabase Auth, não envia email. O tenant fica em `status: 'pending'` sem forma de acessar o console.

Esta spec implementa o fluxo completo de onboarding: criação do usuário, envio do email de ativação com link para definir senha, e reenvio quando necessário.

---

## Seção 1 — Package `@vello/email`

### Rename

`@vello/transactional` → `@vello/email`. Nenhum consumidor externo importa o package atualmente — rename sem breaking changes.

### Estrutura

```
packages/email/
├── src/
│   ├── client.ts                    ← sendEmail() via Resend SDK
│   ├── templates/
│   │   ├── admin/                   ← Emails do backoffice (branding Vello fixo)
│   │   │   ├── confirm-email.tsx    ← migrado de emails/confirm-email.tsx
│   │   │   └── password-recover.tsx ← migrado de emails/password-recover.tsx
│   │   └── console/                 ← Emails do tenant (branding dinâmico — uso futuro)
│   │       └── tenant-welcome.tsx   ← NOVO — email de ativação do tenant
│   ├── layouts/
│   │   ├── admin-layout.tsx         ← Logo Vello, cores fixas, footer "© Vello Finance"
│   │   └── tenant-layout.tsx        ← Props: logoUrl, primaryColor, displayName (uso futuro)
│   └── index.ts                     ← Re-exports de templates + sendEmail
├── package.json                     ← nome: @vello/email, +resend dependency
```

A estrutura de pastas e layouts já prevê multi-domínio no Resend. Nesta fase, o `tenant-welcome.tsx` usa o `admin-layout.tsx` (branding Vello). Quando emails com branding do tenant forem implementados, migram para `tenant-layout.tsx`.

### `client.ts`

```typescript
import { Resend } from 'resend'

export async function sendEmail(options: {
  to: string
  subject: string
  react: React.ReactElement
  from?: string
  apiKey: string
}) {
  const resend = new Resend(options.apiKey)
  return resend.emails.send({
    from: options.from ?? 'Vello Finance <noreply@vellofinance.com.br>',
    to: options.to,
    subject: options.subject,
    react: options.react,
  })
}
```

A `apiKey` é passada como parâmetro (não lida do env no package) — o consumidor (Server Action do admin) fornece a key do seu env. Isso mantém o package puro e testável.

### Layouts

**`admin-layout.tsx`:** Wrapper com logo Vello fixo, fundo branco, footer "© {year} Vello Finance". Os templates existentes (`confirm-email`, `password-recover`) e o novo `tenant-welcome` usam este layout.

**`tenant-layout.tsx`:** Wrapper preparado para branding dinâmico via props (logoUrl, primaryColor, displayName). Criado nesta fase mas usado apenas futuramente quando emails com branding do tenant forem implementados.

---

## Seção 2 — Template `TenantWelcomeEmail`

Localizado em `templates/admin/tenant-welcome.tsx`. Usa o `tenant-layout.tsx`.

### Props

```typescript
interface TenantWelcomeEmailProps {
  contactName: string          // "Olá, {contactName}"
  resetLink: string            // URL completa de reset de senha
}
```

### Conteúdo

Formatado com `@react-email/components`. O `tenant-layout.tsx` cuida do logo, cores e footer.

```
[Logo — via tenant-layout (logoUrl ou Vello fallback)]

Olá, {contactName}

Sua conta na Vello Finance foi criada com sucesso.
Para começar a usar o painel, defina sua senha clicando no botão abaixo.

[ Definir minha senha ]  ← botão com cor primaryColor (ou #4B64AA fallback)

Ou copie e cole a URL abaixo no seu navegador:
{resetLink}

Se você não esperava este email, pode ignorá-lo com segurança.

© {year} {displayName} — via tenant-layout
```

### `from` do email

Fixo por enquanto: `"Vello Finance <noreply@vellofinance.com.br>"`. Quando domínios customizados forem configurados no Resend, o `from` poderá usar `noreply@{custom_domain}`.

---

## Seção 3 — Migration

```sql
-- supabase/migrations/20260410000000_add_welcome_email_sent_at.sql
ALTER TABLE tenants ADD COLUMN welcome_email_sent_at TIMESTAMPTZ;
```

Campo nullable. `null` = email nunca enviado com sucesso. Populado com `now()` ao enviar o email com sucesso.

---

## Seção 4 — Env

Adicionar `RESEND_API_KEY` em `packages/env/src/admin.ts`:

```typescript
server: {
  SUPABASE_SECRET_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  NODE_ENV: z.enum(['development', 'test', 'production']),
},
```

---

## Seção 5 — Fluxo `createTenant` (atualizado)

A Server Action `createTenant` em `apps/admin/src/app/(private)/tenants/actions.ts` ganha os seguintes passos **após** a criação do tenant e branding:

### 5.1 Campo novo no formulário

Adicionar campo "Nome do contato" (`contact_name`) ao formulário, ao lado do campo de email. Validação Zod: `z.string().min(2).max(100)`.

Este valor NÃO é salvo na tabela `tenants` — é usado apenas para:
- `tenant_users.full_name`
- Saudação no email ("Olá, {contactName}")

### 5.2 Criar usuário no Supabase Auth

```typescript
const serviceClient = createServiceClient()
const tempPassword = crypto.randomUUID()

const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
  email: tenantResult.data.email,
  password: tempPassword,
  email_confirm: true, // pula verificação de email
})
```

### 5.3 Inserir em `tenant_users`

```typescript
await serviceClient
  .from('tenant_users')
  .insert({
    id: authUser.user.id,
    tenant_id: tenant.id,
    role: 'tenant_admin',
    full_name: contactName,
  })
```

Usa `serviceClient` (service role) porque o backoffice user não tem permissão RLS para inserir em `tenant_users` de outro tenant.

### 5.4 Gerar link de recovery

```typescript
const { data: linkData } = await serviceClient.auth.admin.generateLink({
  type: 'recovery',
  email: tenantResult.data.email,
})
```

### 5.5 Construir URL de reset

```typescript
const domain = tenantResult.data.custom_domain
  ?? `${tenantResult.data.slug}.${env.CONSOLE_BASE_DOMAIN}`
const resetUrl = `https://${domain}/reset-password?token=${linkData.properties.hashed_token}&type=recovery`
```

### 5.6 Buscar branding para o email

```typescript
const { data: branding } = await serviceClient
  .from('tenant_branding')
  .select('logo_url, company_display_name, theme_color')
  .eq('tenant_id', tenant.id)
  .single()
```

### 5.7 Enviar email

```typescript
import { sendEmail, TenantWelcomeEmail } from '@vello/email'

const displayName = branding?.company_display_name ?? tenantResult.data.name

const { error: emailError } = await sendEmail({
  apiKey: env.RESEND_API_KEY,
  to: tenantResult.data.email,
  subject: 'Bem-vindo à Vello Finance — defina sua senha',
  react: TenantWelcomeEmail({
    contactName,
    displayName,
    resetLink: resetUrl,
    logoUrl: branding?.logo_url,
    primaryColor: branding?.theme_color,
  }),
})
```

### 5.8 Atualizar `welcome_email_sent_at`

```typescript
if (!emailError) {
  await supabase
    .from('tenants')
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq('id', tenant.id)
}
```

### 5.9 Tratamento de falha

- Se a criação do auth user falhar: retorna erro, tenant existe mas sem acesso.
- Se o envio do email falhar: tenant + usuário existem, `welcome_email_sent_at` fica `null`. A action retorna sucesso com aviso: "Parceiro cadastrado, mas o email de ativação não pôde ser enviado."
- Em ambos os casos, o admin pode usar o reenvio (Seção 6).

---

## Seção 6 — Reenvio do Email

### Server Action `resendWelcomeEmail(tenantId: string)`

Nova action em `apps/admin/src/app/(private)/tenants/actions.ts`:

1. Busca tenant (email, slug, custom_domain, name)
2. Busca branding (logo_url, company_display_name, theme_color)
3. Busca primeiro `tenant_user` com `role = 'tenant_admin'` para obter `full_name` e `email` (via auth user id)
4. Gera novo link de recovery via `supabase.auth.admin.generateLink()`
5. Constrói URL de reset
6. Envia `TenantWelcomeEmail` via `sendEmail()`
7. Atualiza `welcome_email_sent_at = now()`

### UI no Admin

Na página de edição do tenant (`/tenants/[id]/edit`):
- Botão "Reenviar email de ativação" sempre visível na seção de dados do contato
- Indica status: "Email enviado em {data}" ou "Email não enviado"
- Ao clicar, chama `resendWelcomeEmail`, exibe toast de sucesso/erro

Na listagem de tenants:
- Badge "Email pendente" quando `welcome_email_sent_at` é `null` e `status` é `pending`

---

## Seção 7 — Atualização do `CLAUDE.md`

Atualizar a seção de packages para refletir:
- `packages/email` em vez de `packages/transactional`
- Descrição: "Templates React Email (admin/ e console/) + envio via Resend"
- Layouts: `admin-layout.tsx` (branding Vello fixo) e `tenant-layout.tsx` (branding dinâmico por tenant)

---

## Seção 8 — Fora do Escopo

- Configuração de domínio customizado no Resend para `from` com custom_domain (pendente de setup manual)
- Email de ativação para tenants do tipo `subscription` (apenas `whitelabel` nesta spec)
- Fluxo de reenvio automático (retry) — apenas manual via botão no admin
- Tela de reset de senha no console (já existe em `/reset-password`)
- Emails com branding do tenant no corpo (password-recover do console, etc.) — usar `tenant-layout.tsx` quando implementados
