# Design: Simulador — Categorias, Limites do DB e Simulações

**Data:** 2026-05-13
**App:** `apps/store`
**Status:** Aprovado — aguardando implementação

---

## Visão Geral

Tornar o simulador 100% funcional conectando-o ao banco de dados real:
produtos agrupados por categoria, limites/taxas/prazos vindos do DB, gravação
automática da simulação ao chegar no resultado, e fluxo de pré-qualificação ao
clicar em "Quero contratar". O fluxo `/solicitar` (2 etapas com CPF/endereço)
é removido — o atendente coleta os dados pessoais após o contato.

---

## 1. Banco de Dados

### Migration A — `category` em `product_types`

```sql
ALTER TABLE product_types
  ADD COLUMN category TEXT CHECK (
    category IN ('pessoa_fisica','pessoa_juridica','financiamentos')
  );

UPDATE product_types SET category = 'pessoa_fisica'
  WHERE slug IN ('fgts','consignado_publico','consignado_privado',
                 'home_equity','auto_equity','emprestimo_pessoal','conta_luz','outros');

UPDATE product_types SET category = 'pessoa_juridica'
  WHERE slug IN ('home_equity_pj','auto_equity_pj',
                 'capital_giro','antecipacao_recebiveis');

UPDATE product_types SET category = 'financiamentos'
  WHERE slug IN ('financiamento_imovel','financiamento_veiculo');
```

### Migration B — tabela `simulations`

```sql
CREATE TABLE simulations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  product_id          UUID NOT NULL REFERENCES products(id),
  client_name         TEXT NOT NULL,
  client_phone        TEXT NOT NULL,
  desired_amount      NUMERIC(12,2) NOT NULL,
  desired_term_months INT NOT NULL,
  estimated_rate      NUMERIC(6,4),
  estimated_payment   NUMERIC(12,2),
  simulation_data     JSONB,             -- payload completo do formulário
  status              TEXT NOT NULL DEFAULT 'rascunho'
                      CHECK (status IN ('rascunho','pre_qualificado')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON simulations FOR ALL
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "backoffice_full_access" ON simulations FOR ALL
  USING ((auth.jwt() ->> 'user_role') = ANY(
    ARRAY['super_admin','admin','financial','support']
  ));
```

---

## 2. Queries

### Nova: `listActiveProductsByCategory`

```ts
listActiveProductsByCategory(
  tenantId: string,
  category: 'pessoa_fisica' | 'pessoa_juridica' | 'financiamentos'
): Promise<TenantProduct[]>
```

Substitui a filtragem por slug feita no código das 3 páginas seletoras.
Faz join `tenant_products → products → product_types` filtrando por
`product_types.category` e `tenant_id`.

### Nova: `getSimulation`

```ts
getSimulation(simulationId: string, tenantId: string): Promise<Simulation | null>
```

Usada pela página `/agradecimento/[id]` para exibir nome do produto.

### Removida: `getProposalConfirmation`

---

## 3. Fluxo de Dados do Simulador

### Páginas seletoras

As 3 páginas (`pessoa-fisica`, `pessoa-juridica`, `financiamentos`) usam
`listActiveProductsByCategory` em vez de filtrar por slug. Os mapas
`SLUG_TO_ROUTE` e `*_LABELS` são removidos.

### Form pages → form components

Cada `page.tsx` de formulário já busca `getTenantProduct`. Os dados do produto
(`min_amount`, `max_amount`, `min_term_months`, `max_term_months`,
`min_rate_monthly`) são passados como props ao Client Component do formulário:

```tsx
<EmprestimoPessoalForm
  productId={productId}
  minTermMonths={tp.products.min_term_months ?? 6}
  maxTermMonths={tp.products.max_term_months ?? 48}
  maxAmount={tp.products.max_amount ?? undefined}
  minAmount={tp.products.min_amount ?? undefined}
/>
```

### Form components

- Arrays de parcelas hardcoded → `generateTermOptions(minTermMonths, maxTermMonths)` via `useMemo`
- Limites de valor hardcoded → props `minAmount` / `maxAmount`
- Formulários FGTS e financiamentos (sem campo de parcelas) não alteram este ponto

---

## 4. Salvar e Qualificar Simulação

### Server Actions (`simulador/actions.ts`)

**`saveSimulation(input)`** — chamada no `useEffect` do resultado ao ler
`sessionStorage`. Recebe `tenantProductId` (o `productId` da URL) + dados do
payload. Internamente busca o `product_id` real. Insere em `simulations` com
`status: 'rascunho'`. Retorna o `id` da simulação (ou `null` se falhar — falha
silenciosa, não bloqueia o UX). O `id` é guardado em
`sessionStorage['sim:<slug>:id']` para evitar duplicação em recargas.

**`qualifySimulation(simulationId)`** — chamada ao clicar em "Quero contratar".
Atualiza `status` para `pre_qualificado`. Redireciona para
`/agradecimento/${simulationId}`.

### Resultado components

1. `useEffect`: após ler sessionStorage, chama `saveSimulation` e guarda o id
2. Botão "Quero contratar": desabilitado enquanto `simulationId` é null;
   ao clicar, chama `qualifySimulation(simulationId)`

---

## 5. Página `/agradecimento/[id]`

Server Component que busca a simulação pelo id. Exibe:
- Nome do produto
- "Recebemos seu interesse! Um de nossos consultores vai entrar em contato pelo
  WhatsApp em breve."

Acesso público (sem autenticação), isolado por `tenant_id` via RLS com
service role (igual às demais páginas da store).

---

## 6. Remoções

| O que remover | Motivo |
|---|---|
| `apps/store/src/app/(store)/solicitar/` | Substituído pelo fluxo de simulação + qualificação |
| `apps/store/src/app/(store)/confirmacao/` | Era pós-solicitar |
| `getProposalConfirmation` em `queries.ts` | Sem uso após remoção do solicitar |
| Mapas `SLUG_TO_ROUTE` / `*_LABELS` nos seletores | Substituídos pela query por categoria |

---

## 7. Fora de Escopo (esta entrega)

- Geração de PDF da simulação
- Envio de notificação WhatsApp/e-mail ao atendente
- Conversão de simulação em proposta completa (fluxo do console)
- Painel de simulações no console/admin
