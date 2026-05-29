# Console — Analytics, Clientes, Financeiro e Relatórios

**Data:** 2026-05-28
**Escopo:** `apps/console`
**Tipo:** Somente leitura (exceto exportações CSV geradas no servidor)

---

## Contexto

O console já possui Dashboard, Simulações e Propostas. Esta spec adiciona quatro áreas:

1. **Dashboard** — novos KPI cards de funil de leads e comissões
2. **Clientes** — página existente (disabled) ativada com visão unificada da jornada do lead
3. **Financeiro** — nova seção no sidebar com detalhes de comissões
4. **Relatórios** — nova seção com dois relatórios de origem (leads e vendas)

Todas as telas são **somente leitura** no console. Ações como marcar comissão como paga são feitas no admin. Exportações CSV são geradas via Server Action no servidor (padrão fat-server thin-client).

---

## 1. Dashboard — Novos KPIs

### 1.1 Novo grupo: Funil de Leads

Quatro cards adicionados após os KPI cards atuais, em linha horizontal. Reutilizam o componente `KpiCards` existente em `(dashboard)/_components/kpi-cards.tsx` via novas props.

| Card | Label | Fonte | Regra |
|---|---|---|---|
| Abandonaram | "Abandonaram" | `simulations` | `status = 'rascunho'` sem proposta vinculada |
| Apenas simularam | "Apenas simularam" | `simulations` LEFT JOIN `proposals` | `status = 'pre_qualificado'` sem proposta |
| Em contratação | "Em contratação" | `proposals` | `status IN ('em_analise', 'pre_aprovada', 'necessita_detalhes')` |
| Contrataram | "Contrataram" | `proposals` | `status = 'aprovada'` |

### 1.2 Novo grupo: Financeiro resumido

Três cards adicionados na linha seguinte ao grupo de funil.

| Card | Label | Fonte | Regra |
|---|---|---|---|
| A receber | "Comissões a receber" | `commission_snapshots` | soma `tenant_commission_amount` onde `status != 'pago'` |
| Recebidas | "Comissões recebidas" | `commission_snapshots` | soma `tenant_commission_amount` onde `status = 'pago'` |
| Taxa de conversão | já existe | — | manter posição atual |

### 1.3 Queries

Adicionar `getDashboardFunnelKpis()` e `getDashboardCommissionKpis()` em `(dashboard)/queries.ts`. Chamadas em paralelo no `Promise.all` da `DashboardPage`.

---

## 2. Clientes — Visão unificada da jornada

**Rota:** `/clients`
**Sidebar:** ativar item "Clientes" (remover `disabled: true` em `nav-main.tsx`)

### 2.1 Estrutura da página

Segue o padrão de `simulations/page.tsx`:

```
Header: "Clientes." + subtítulo + botão "Exportar CSV"
KPI Cards (4): Total de leads | Abandonaram | Em contratação | Contrataram
Filtros: estágio | produto | período
Tabela unificada
```

### 2.2 KPI Cards

| Card | Regra |
|---|---|
| Total de leads | count de simulations distintas |
| Abandonaram | simulations `status = 'rascunho'` sem proposta |
| Em contratação | proposals com status de pipeline |
| Contrataram | proposals `status = 'aprovada'` |

### 2.3 Tabela de leads

Registro base = simulação. JOIN com proposals para enriquecer estágio.

| Coluna | Dado |
|---|---|
| Nome | `simulations.client_name` |
| Produto | `products.name` |
| Estágio | badge derivado (ver regra abaixo) |
| Valor solicitado | `simulations.desired_amount` formatado em BRL |
| Origem | "Loja própria" se `seller_id IS NULL`, senão nome do vendedor via JOIN em `tenant_users` |
| Data | `simulations.created_at` formatado |

**Regra de derivação do estágio:**

```
sem proposta + status = 'rascunho'        → badge cinza   "Abandonou"
sem proposta + status = 'pre_qualificado' → badge azul    "Simulou"
com proposta em pipeline                  → badge amarelo "Em contratação"
com proposta status = 'aprovada'          → badge verde   "Contratou"
```

### 2.4 Filtros

Implementados como query params (`?estagio=&produto=&de=&ate=`). Aplicados na query do servidor. Componente de filtros reutiliza o `DateRangePicker` de `proposals/_components/date-range-picker.tsx` e dropdowns de shadcn/ui `Select`.

### 2.5 Exportação CSV

Server Action `exportClientsCsv(filters)` gera CSV no servidor com as colunas: Nome, Produto, Estágio, Valor, Origem, Data. Retorna como `Response` com `Content-Disposition: attachment`.

---

## 3. Financeiro — Detalhes de comissões

**Rota:** `/financeiro`
**Sidebar:** nova seção "Financeiro" entre "Originação" e "Catálogo"

### 3.1 Estrutura da página

```
Header: "Financeiro." + subtítulo + date range picker
KPI Cards (3): A receber | Recebido | Próximo pagamento
Filtros: status (a receber / pago) | período
Tabela de comissões por proposta
```

### 3.2 KPI Cards

| Card | Dado | Fonte |
|---|---|---|
| A receber | soma `tenant_commission_amount` onde `status != 'pago'` | `commission_snapshots` |
| Recebido | soma `tenant_commission_amount` onde `status = 'pago'` | `commission_snapshots` |
| Próximo pagamento | data mínima com comissão pendente ou `—` | `commission_snapshots.expected_payment_date` |

### 3.3 Tabela de comissões

JOIN: `commission_snapshots` → `proposals` → `products` + `simulations` (para `client_name` e `desired_amount`).

| Coluna | Dado |
|---|---|
| Cliente | `proposals.client_name` |
| Produto | `products.name` |
| Valor financiado | `simulations.desired_amount` |
| % Comissão | `commission_snapshots.tenant_commission_pct` |
| Valor comissão | `commission_snapshots.tenant_commission_amount` |
| Status | badge: "A receber" (amarelo) / "Pago" (verde) |
| Data | `commission_snapshots.created_at` |

### 3.4 Filtros

Query params: `?status=&de=&ate=`. Sem estado client-side.

### 3.5 Ações do admin

Esta página é read-only. A coluna `status` em `commission_snapshots` é atualizada pelo admin. Nenhuma Server Action de escrita no console.

---

## 4. Relatórios — Origem de leads e vendas

**Sidebar:** nova seção "Relatórios" após "Catálogo"

### 4.1 Origem de Leads (`/relatorios/origem-leads`)

Responde: *de onde vieram os leads?*

**Estrutura:**
```
Header: "Origem de Leads." + subtítulo + botão "Exportar CSV"
KPI Cards (3): Total de leads | Pela loja própria | Por vendedores
Gráfico de barras: volume por origem (Recharts, padrão do projeto)
Tabela detalhada
```

**Tabela:**

| Coluna | Dado |
|---|---|
| Origem | "Loja própria" (`seller_id IS NULL`) ou nome do vendedor |
| Leads | count de simulations |
| Convertidos | count de proposals vinculadas |
| Taxa de conversão | % (convertidos / leads) |
| Volume solicitado | soma `desired_amount` |

**Filtros:** período e produto — query params.

**Exportação:** Server Action `exportLeadOriginCsv(filters)`.

### 4.2 Origem de Vendas (`/relatorios/origem-vendas`)

Responde: *de onde vieram as propostas aprovadas?*

Mesma estrutura do relatório anterior, filtrando apenas `proposals.status = 'aprovada'`.

**Tabela:**

| Coluna | Dado |
|---|---|
| Origem | "Loja própria" ou nome do vendedor |
| Propostas aprovadas | count |
| Volume contratado | soma `desired_amount` |
| Comissão gerada | soma `tenant_commission_amount` via `commission_snapshots` |

**Exportação:** Server Action `exportSalesOriginCsv(filters)`.

### 4.3 Dependência: Sales Team

Os relatórios de origem dependem da coluna `simulations.seller_id` definida na spec `2026-05-16-sales-team-design.md`. Quando `seller_id IS NULL`, a origem é "Loja própria". Quando preenchido, JOIN em `tenant_users` para obter o nome. Se a migration do Sales Team ainda não foi aplicada, `seller_id` não existe — nesse caso, todos os leads aparecem como "Loja própria" até que a migration seja rodada.

---

## 5. Sidebar — alterações em `nav-main.tsx`

```
Visão Geral
  Dashboard
  Analytics (disabled)

Originação
  Simulações
  Propostas
  Clientes          ← ativar (remover disabled)

Financeiro          ← nova seção
  Financeiro

Catálogo
  Produtos
  Campanhas (disabled)

Relatórios          ← nova seção
  Origem de Leads
  Origem de Vendas

Sistema
  Usuários
  Configurações
```

---

## 6. Convenções e restrições

- **Fat server, thin client:** todas as queries rodam em Server Components. Nenhum `supabase/client.ts` além de auth e realtime.
- **Imports:** sempre via alias `@/` — nunca caminhos relativos.
- **Tailwind:** apenas classes padrão, sem valores arbitrários.
- **Responsivo:** todos os layouts usam grid Tailwind com breakpoints. Mobile-first.
- **Sem comentários:** código auto-explicativo pelo nome dos identificadores.
- **Novos componentes:** apenas quando não existe componente reutilizável. Preferir estender props de existentes.

---

## 7. Fora de escopo

- Ações de escrita no console para comissões (feito no admin)
- Gestão de vendedores (coberto pela spec de Sales Team)
- Notificações de pagamento (coberto por features futuras de email)
- Analytics avançados (coberto pelo item "Analytics" disabled no sidebar)
