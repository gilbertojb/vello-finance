# Feature Spec — Planos de Assinatura

**App:** `apps/admin` — Vello Admin
**Módulo:** Admin / Planos
**Status:** `ready-for-dev`
**Prioridade:** Alta — base para cadastro de tenants

---

## Contexto

Planos definem o modelo comercial de cada tenant. A cobrança não é automatizada —
os planos orientam o onboarding manual e determinam o percentual de comissão padrão do tenant.

Tipos de plano:
- **SaaS:** mensalidade recorrente + % sobre comissões
- **White-Label:** taxa única de setup + % sobre comissões (sem mensalidade)

---

## Funcionalidades

### F1 — Listagem · `/plans`
- Tabela: Nome · Tipo · Mensalidade · Taxa de Setup · Comissão do Tenant · Status · Ações
- Filtros: Tipo · Status
- Botão "Novo Plano"

**Aceite:**
- [ ] Mensalidade exibe "—" para White-Label
- [ ] Badge de status: verde (ativo) / cinza (inativo)
- [ ] Inativos aparecem com opacidade reduzida

---

### F2 — Criar · `/plans/new`

| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| Nome | Text | Sim | 3–100 chars, único |
| Tipo | Select | Sim | `signature` / `white_label` |
| Mensalidade (R$) | Number | Se SaaS | > 0 |
| Taxa de Setup (R$) | Number | Não | >= 0, default 0 |
| Comissão do Tenant (%) | Number | Sim | 0,0001–100, 4 decimais |
| Máx. Produtos | Number | Não | >= 1, vazio = ilimitado |
| Features | Tags | Não | Texto livre |
| Ativo | Toggle | — | Default: true |

**Aceite:**
- [ ] Campo Mensalidade desabilitado quando Tipo = White-Label
- [ ] Ao salvar: redirect para listagem com toast de sucesso
- [ ] Nome duplicado: erro inline no campo

---

### F3 — Editar · `/plans/[id]/edit`
- Formulário idêntico ao de criação, pré-preenchido
- Campo **Tipo** é read-only após criação (tooltip explicativo)
- Aviso no topo: *"Alterações não afetam comissões de propostas já registradas"*

---

### F4 — Desativar / Reativar
- Modal de confirmação antes de desativar
- Plano inativo: não aparece no select ao cadastrar novos tenants
- Tenants existentes com o plano não são afetados

**Aceite:**
- [ ] Modal exibe: *"Este plano não estará disponível para novos tenants. Tenants existentes não são afetados."*

---

### F5 — Detalhes · `/plans/[id]`
- Todos os dados do plano
- Lista de tenants que usam o plano (nome, status, data de ativação)
- Contador de tenants ativos no plano

---

## Arquivos a Criar

```
apps/admin/src/app/(private)/plans/
├── page.tsx
├── new/page.tsx
├── [id]/
│   ├── page.tsx
│   └── edit/page.tsx
├── actions.ts
├── queries.ts
└── _components/
    ├── plan-table.tsx
    ├── plan-form.tsx
    └── plan-status-badge.tsx

supabase/migrations/
└── 20260401120000_create_plans.sql
```

## Restrições de implementação

- `page.tsx` é Server Component — busca dados diretamente no Supabase server client
- `_components/plans-table.tsx` é Client Component — recebe `plans` via props, sem acesso ao banco
- `actions.ts` usa `'use server'` — único ponto de mutação, nunca exportar para o cliente
- `queries.ts` é importado apenas por Server Components e Actions — nunca por Client Components