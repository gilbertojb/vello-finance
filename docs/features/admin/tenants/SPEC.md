# Feature Spec — Gestão de Tenants (White-Label — MVP)

**App:** `apps/admin` — Vello Admin
**Módulo:** Admin / Tenants
**Status:** `ready-for-dev`
**Prioridade:** Alta
**Escopo MVP:** Apenas White-Labels

---

## Funcionalidades

### F1 — Listagem · `/tenants`
- Tabela: Nome · CNPJ · Tipo · Plano · Status · Criado em · Ações
- Filtros: Status · Busca por nome, CNPJ ou slug
- Contador: "X tenants ativos"

---

### F2 — Criar · `/tenants/new`

**Seção 1 — Dados da Empresa**

| Campo | Obrigatório | Validação |
|---|---|---|
| Tipo (White-Label / SaaS) | Sim | SaaS desabilitado no MVP com tooltip |
| Nome Fantasia | Sim | 2–100 chars |
| Razão Social | Sim | 2–150 chars |
| CNPJ | Sim | Dígitos verificadores validados |
| Email de Contato | Sim | Formato válido |
| Telefone | Não | — |

**Seção 2 — Configuração da Loja**

| Campo | Obrigatório | Validação |
|---|---|---|
| Slug | Sim | Lowercase, sem espaços, único — auto-gerado do nome |
| Domínio Customizado | Não | Formato válido (ex: `creditos.empresa.com.br`) |
| Cor Primária | Sim | Hex, default `#2563EB` |
| Cor Secundária | Sim | Hex, default `#1E3A5F` |

**Seção 3 — Plano**

| Campo | Obrigatório | Detalhe |
|---|---|---|
| Plano | Sim | Apenas planos ativos do tipo White-Label |

> Ao selecionar plano: exibe informativo com a comissão padrão do plano.

**Seção 4 — Dados Bancários** (podem ser preenchidos depois)

Banco · Agência · Conta · Chave Pix

**Aceite:**
- [ ] Slug auto-gerado ao digitar Nome Fantasia, editável manualmente
- [ ] Preview da URL em tempo real: `[slug].vellofinance.com.br`
- [ ] CNPJ duplicado: erro inline
- [ ] Ao criar: `status = 'pending'`, navega para página de detalhes

---

### F3 — Ativar Tenant
**Gatilho:** Botão na página de detalhes quando `status = 'pending'`

**Pré-requisito:** ao menos 1 produto habilitado (F6)

**Comportamento:**
- `status → 'active'`, registra `activated_at`
- Cria usuário admin do tenant no Supabase Auth
- Dispara email de boas-vindas (via `packages/transactional` + Resend)

**Aceite:**
- [ ] Sem produtos: aviso + botão Ativar desabilitado
- [ ] Modal de confirmação antes de ativar
- [ ] Após ativação: link da loja exibido na página de detalhes

---

### F4 — Editar · `/tenants/[id]/edit`
- Todos os campos editáveis exceto CNPJ e Tipo (read-only com tooltip)

---

### F5 — Suspender / Cancelar / Reativar

| Status atual | Ações disponíveis |
|---|---|
| `pending` | Ativar · Cancelar |
| `active` | Suspender · Cancelar |
| `suspended` | Reativar · Cancelar |
| `cancelled` | — (somente leitura) |

- **Suspensão:** perde acesso ao Console e Store fica fora do ar. Dados preservados.
- **Cancelamento:** irreversível. Requer digitar o nome do tenant para confirmar.

---

### F6 — Gerenciar Produtos · `/tenants/[id]/products`

Lista todos os produtos ativos da Vello. Para cada produto:

| Campo | Editável | Descrição |
|---|---|---|
| Comissão do Banco (%) | Não | O que o banco paga à Vello |
| Retenção Vello (%) | Não | O que a Vello retém |
| Disponível ao Tenant (%) | Não | Banco − Vello (calculado) |
| **Comissão do Tenant (%)** | **Sim** | O que o tenant recebe |
| **Spread Vello (%)** | Não (auto) | Disponível − Comissão Tenant |

> Comissão do Tenant pré-preenchida com o padrão do plano.
> Spread Vello atualiza em tempo real.
> Validação: Comissão Tenant ≤ Disponível ao Tenant.

**Aceite:**
- [ ] Salvar cria ou atualiza `tenant_products`
- [ ] Não afeta snapshots de propostas existentes

---

### F7 — Detalhes · `/tenants/[id]`

Seções: Header com status e link da loja · Dados cadastrais · Produtos habilitados · Métricas (placeholder) · Dados bancários

---

## Arquivos a Criar

```
apps/admin/app/(app)/tenants/
├── page.tsx
├── new/page.tsx
├── [id]/
│   ├── page.tsx
│   ├── edit/page.tsx
│   └── products/page.tsx
├── actions.ts
├── queries.ts
└── _components/
    ├── TenantTable.tsx
    ├── TenantForm.tsx
    ├── TenantStatusBadge.tsx
    ├── TenantStatusActions.tsx
    └── TenantProductsManager.tsx

supabase/migrations/
├── 20260401130000_create_tenants.sql
└── 20260401140000_create_tenant_products.sql
```
