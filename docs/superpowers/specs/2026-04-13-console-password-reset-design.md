# Design: Fluxo de Reset de Senha — Vello Console

**Data:** 2026-04-13
**App:** `apps/console`
**Status:** Aprovado

---

## Contexto

O fluxo de onboarding já envia um e-mail de boas-vindas com um link de recovery para `/reset-password`. Este spec implementa as duas páginas públicas que completam o ciclo:

- `/forgot-password` — solicitar novo link de recuperação
- `/reset-password` — definir nova senha a partir de um token

Ambas as rotas já estão declaradas no `proxy.ts` como públicas.

---

## Arquitetura

Segue o padrão do console: **Server Component page → Client Component form → Server Action + `useFormState`**.

O browser nunca chama o Supabase diretamente. Toda operação de auth ocorre em Server Actions.

---

## `/forgot-password`

### Comportamento

1. Usuário informa o e-mail
2. Server Action verifica se o e-mail pertence a um usuário do tenant atual
3. Gera link de recovery via `serviceClient.auth.admin.generateLink({ type: 'recovery', email })`
4. Constrói `resetUrl` com base no `host` do request (igual ao padrão de `create-tenant.ts`)
5. Envia e-mail via Resend usando o novo template `TenantPasswordRecoveryEmail`
6. Retorna sucesso **independente** de o e-mail existir (evita enumeração de usuários)
7. Form exibe mensagem de confirmação inline — **não redireciona**

### Arquivos

```
apps/console/src/app/(public)/forgot-password/
├── page.tsx                  ← Server Component, renderiza o form
├── forgot-password-form.tsx  ← Client Component com campo email
└── actions.ts                ← Server Action: gera link + envia e-mail
```

### Server Action — lógica

```
1. Valida email (zod)
2. Lê host via headers() → constrói domain
3. serviceClient.auth.admin.generateLink({ type: 'recovery', email })
   → se erro: retorna success: true mesmo assim (não enumera)
4. resetUrl = `https://${host}/reset-password?token=${hashed_token}&type=recovery`
5. sendEmail({ to: email, react: TenantPasswordRecoveryEmail({ resetLink, tenantName }) })
6. Retorna { success: true, message: 'Se esse e-mail estiver cadastrado, você receberá as instruções em breve.' }
```

---

## `/reset-password`

### Comportamento

1. Página lê `token` e `type` de `searchParams` (Server Component)
2. Se ausentes → renderiza estado de erro estático ("Link inválido ou expirado")
3. Se presentes → renderiza o form com `token` e `type` como hidden inputs
4. Usuário define nova senha + confirma
5. Server Action: `verifyOtp` → `updateUser` → redireciona para `/`
6. Se `verifyOtp` falhar → retorna erro "Link inválido ou expirado. Solicite um novo."

### Arquivos

```
apps/console/src/app/(public)/reset-password/
├── page.tsx                   ← Server Component: lê searchParams, trata ausência
├── reset-password-form.tsx    ← Client Component: password + confirm + hidden inputs
└── actions.ts                 ← Server Action: verifyOtp + updateUser + redirect
```

### Server Action — lógica

```
1. Valida: password min 8 chars, password === confirm_password (zod)
2. supabase.auth.verifyOtp({ token_hash: token, type: 'recovery' })
   → erro: return { success: false, message: 'Link inválido ou expirado. Solicite um novo.' }
3. supabase.auth.updateUser({ password })
   → erro: return { success: false, message: error.message }
4. redirect('/')
```

---

## Novo template de e-mail

### Localização

```
packages/email/src/templates/console/tenant-password-recovery.tsx
```

### Props

```typescript
interface TenantPasswordRecoveryEmailProps {
  contactName: string   // nome do destinatário (se disponível; senão omitir saudação)
  resetLink: string     // URL completa do reset
  tenantName?: string   // nome da empresa para o e-mail (opcional)
}
```

### Layout

Usa `TenantLayout` (já existe em `packages/email/src/layouts/tenant-layout.tsx`) — herda `logoUrl`, `primaryColor`, `displayName` do tenant. Como a Server Action no console não tem acesso fácil ao branding completo, o e-mail pode ser enviado sem os parâmetros opcionais de branding na primeira iteração, usando os defaults do layout.

### Export

Adicionar re-export em `packages/email/src/index.ts`.

---

## Validação de senha

- Mínimo 8 caracteres
- Senhas devem ser iguais (validado no cliente via Zod e revalidado na Server Action)
- Sem requisitos de complexidade adicionais nesta iteração

---

## Estados de UI

### `/forgot-password`

| Estado | UI |
|---|---|
| Inicial | Form com campo email + botão |
| Pending | Botão com spinner, desabilitado |
| Sucesso | Alert verde com mensagem genérica (não enumera usuários) |
| Erro inesperado | Alert destrutivo com mensagem |

### `/reset-password`

| Estado | UI |
|---|---|
| Token ausente | Mensagem de erro estática + link para `/forgot-password` |
| Inicial | Form com password + confirm |
| Pending | Botão com spinner, desabilitado |
| Erro (token inválido) | Alert destrutivo + link para `/forgot-password` |
| Sucesso | redirect('/') |

---

## Fora do escopo desta iteração

- Branding dinâmico (logo/cor) no e-mail de recovery — depende de buscar `tenant_branding` na action
- Throttling / rate limiting de solicitações de reset
- Expiração customizada do token (usa default do Supabase)
- Campo de força de senha visual
