# Design — CRUD de Instituições Financeiras

**Data:** 2026-04-04
**App:** `apps/admin` — Vello Admin
**Módulo:** Admin / Instituições Financeiras
**Status:** `approved`

---

## Contexto

A tabela `financial_partners` já existe com RLS configurada. Falta a camada de aplicação: páginas, formulários, actions e queries para que o backoffice possa gerenciar as IFs via interface.

O padrão segue o módulo de produtos: Server Components para listagem/fetch, Client Components para formulários, Server Actions para mutações.

---

## Estrutura de Arquivos

```
apps/admin/src/app/(private)/financial-partners/
├── page.tsx                          ← listagem (Server Component)
├── new/page.tsx                      ← formulário de criação
├── [id]/
│   └── edit/page.tsx                 ← formulário de edição
├── actions.ts                        ← Server Actions
├── queries.ts                        ← queries server-side
└── _components/
    ├── financial-partner-table.tsx   ← tabela (Client Component)
    └── financial-partner-form.tsx    ← formulário (Client Component)

apps/admin/src/components/sidebar/nav-main.tsx
  ← renomear label "Parceiros Bancários" → "Instituições Financeiras"
```

---

## Campos do Formulário

| Campo | Input | Obrigatório | Visível para |
|---|---|---|---|
| Nome | text | Sim | todos |
| Tipo | select | Sim | todos |
| URL da API | text | Não | todos |
| Chave de API | text (masked no edit) | Não | apenas `super_admin` |
| Webhook Secret | text (masked no edit) | Não | apenas `super_admin` |
| Ativo | switch | — | todos |

**Tipos disponíveis:** `qi_tech` · `bancly` · `zip` · `other`

---

## Segurança — Campos Sensíveis

`api_key_enc` e `webhook_secret` são campos sensíveis:

1. **Formulário:** campos só renderizados se `role === 'super_admin'` (verificado no Server Component via `auth.getUser()` + JWT claims)
2. **Edit:** exibe placeholder `"••••••••"` — campo vazio significa "manter valor atual"; só atualiza se novo valor for digitado
3. **Server Action:** ignora `api_key_enc` e `webhook_secret` no parse se o role não for `super_admin` — proteção server-side independente do UI

---

## Listagem

Tabela com colunas: Nome · Tipo · URL da API · Status · Ações (Editar)

Campos sensíveis **nunca** aparecem na listagem.

---

## Actions

### `createFinancialPartner(data: FormData)`
- Valida com Zod
- Campos sensíveis só incluídos no insert se role = `super_admin`
- `revalidatePath('/financial-partners')`

### `updateFinancialPartner(id: string, data: FormData)`
- Valida com Zod
- Campos sensíveis: incluídos no update apenas se preenchidos E role = `super_admin`
- `revalidatePath('/financial-partners')`

### `toggleFinancialPartner(id: string, isActive: boolean)`
- Alterna `is_active`
- `revalidatePath('/financial-partners')`

---

## Restrições de Implementação

- `page.tsx` e `[id]/edit/page.tsx` são Server Components — buscam dados e role no servidor
- `_components/` são Client Components — recebem dados via props
- `actions.ts` usa `'use server'` — único ponto de mutação
- `queries.ts` importado apenas por Server Components e Actions
