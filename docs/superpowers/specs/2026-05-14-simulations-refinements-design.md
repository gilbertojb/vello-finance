# Design — Refinamentos da Listagem de Simulações

**Data:** 2026-05-14
**Apps:** `apps/store`, `apps/console`
**Status:** Aprovado pelo usuário — pronto para plano de implementação

---

## Contexto

O módulo de simulações do console exibe leads gerados pelo simulador da loja. Atualmente a listagem é simples (3 stats cards + tabela básica) e não há painel de detalhes. O objetivo é enriquecer a listagem com novas colunas, adicionar um sheet de detalhes lateral, e coletar mais dados pessoais do lead no fluxo da store.

---

## Campos removidos do escopo

- Score de conversão (engine não implementada)
- Origem (UTM/canal)
- Linha do tempo de eventos
- Status adicionais (mantém apenas 2 valores)

---

## Banco de dados

### Migration: adicionar campos pessoais em `simulations`

```sql
ALTER TABLE simulations
  ADD COLUMN client_email     TEXT,
  ADD COLUMN client_cpf       TEXT,
  ADD COLUMN client_birthdate DATE,
  ADD COLUMN client_city      TEXT,
  ADD COLUMN client_income    NUMERIC(12,2);
```

Todos nullable — não há retrocompatibilidade a quebrar.

### Status — sem alteração nos valores do banco

| Valor DB | Label UI |
|---|---|
| `rascunho` | Não qualificado |
| `pre_qualificado` | Pré-qualificado |

---

## Store (`apps/store`)

### 1. Campo email no formulário principal

Adicionar campo `email` (type email, required) em todos os simuladores, logo abaixo de telefone. O campo é enviado via `saveSimulation()` e armazenado em `client_email`.

Arquivos afetados:
- `apps/store/src/app/(store)/simulador/actions.ts` — adicionar `clientEmail` ao input e ao INSERT
- Todos os componentes de form que hoje passam `clientName` + `clientPhone` (um por tipo de simulador) — adicionar o campo de email

### 2. Passo de qualificação (nova página)

**Rota:** `apps/store/src/app/(store)/simulador/qualificacao/[id]/page.tsx`

Fluxo atual:
```
resultado → qualifySimulation() → /agradecimento/[id]
```

Fluxo novo:
```
resultado → /simulador/qualificacao/[id] → updateAndQualifySimulation() → /agradecimento/[id]
```

**Campos do formulário de qualificação:**

| Campo | Tipo | Validação |
|---|---|---|
| CPF | Text com máscara `XXX.XXX.XXX-XX` | 11 dígitos numéricos |
| Data de nascimento | Date input | Obrigatório |
| Cidade | Text | Min 2 chars |
| Renda mensal | Número com máscara BRL | Obrigatório |

**Action `updateAndQualifySimulation(id, data)`:**
```typescript
// Atualiza os 4 campos + status = 'pre_qualificado' em uma única chamada
// Redireciona para /agradecimento/[id]
```

O botão "Quero contratar" na página de resultado passa a linkar para `/simulador/qualificacao/[id]` em vez de chamar `qualifySimulation()` diretamente.

---

## Console (`apps/console`)

### 1. Queries (`simulations/queries.ts`)

`listSimulations()` adiciona ao SELECT:
```
client_email,
client_cpf,
client_birthdate,
client_city,
client_income
```

### 2. Listagem — colunas da tabela

| Coluna | Conteúdo |
|---|---|
| Lead | Avatar (iniciais) + nome em negrito + email abaixo |
| Produto | Dot colorido + nome do produto |
| Valor / Condições | `R$ X.XXX · Xm · X,XX% a.m.` |
| Status | Badge: Pré-qualificado (verde) / Não qualificado (cinza) |
| Recebida | Tempo relativo (`há 2h`, `há 3min`) — calculado com JS nativo (sem date-fns) |
| Ações | Ícone de visualizar — abre sheet de detalhes |

Colunas removidas vs. hoje: Telefone separado, ID separado, Parcela separada, Prazo separado.

### 3. Filtros por tabs

```
Todas (N) · Pré-qualificados (N) · Não qualificados (N)
```

Implementados via `useState` no client component — filtragem local sobre os dados já carregados.

### 4. Stats cards

Mantidos como estão (3 cards: total, pré-qualificados, volume simulado). Sem spark lines.

### 5. Sheet de detalhes (`SimulationDetailSheet`)

Componente Sheet (shadcn) que abre ao clicar na linha ou no ícone de visualizar.

**Header do sheet:**

```
SIM-XXXXXXXX  ·  há 2h
Ricardo Ferreira           [×]
● Pré-qualificado   ● Home Equity
```

O ID é gerado no frontend: `'SIM-' + id.replace(/-/g, '').slice(-8).toUpperCase()`

**Seção: Dados Pessoais**

| Label | Valor |
|---|---|
| CPF | `***.XXX.XXX-**` (mascarado — exibe dígitos 4–9) |
| Idade | Calculada de `client_birthdate` (JS nativo: `now.getFullYear() - birth.getFullYear()` com ajuste de mês/dia) + " anos" |
| E-mail | `client_email` |
| Telefone | `client_phone` formatado |
| Cidade | `client_city` |
| Renda mensal | `client_income` em BRL |

Campos `null` exibem `—`.

**Seção: Condições Simuladas**

| Label | Valor | Origem |
|---|---|---|
| Valor solicitado | `desired_amount` BRL | banco |
| Parcela mensal | `estimated_payment` BRL | banco |
| Prazo | `desired_term_months` + " meses" | banco |
| Taxa | `estimated_rate` + "% a.m." | banco |
| CET anual | `((1 + r/100)^12 - 1) × 100` + "%" | calculado |
| Total a pagar | `estimated_payment × desired_term_months` BRL | calculado |

**Rodapé do sheet:**

```
[ Ligar ]   [ E-mail ]   [ Converter em proposta → ]
```

- **Ligar** → `<a href="tel:{client_phone}">` 
- **E-mail** → `<a href="mailto:{client_email}">` — desabilitado se `client_email` for null
- **Converter em proposta** → botão sem ação (placeholder para fluxo futuro)

---

## Arquivos a criar / modificar

```
apps/store/src/app/(store)/simulador/
├── actions.ts                                ← adicionar clientEmail ao input + INSERT; nova action updateAndQualifySimulation
└── qualificacao/
    └── [id]/
        └── page.tsx                          ← nova página com form de qualificação

apps/store/src/app/(store)/simulador/
├── pessoa-fisica/auto-equity/resultado/_components/auto-equity-resultado.tsx
├── pessoa-fisica/conta-luz/resultado/_components/conta-luz-resultado.tsx
├── pessoa-fisica/emprestimo-pessoal/resultado/_components/emprestimo-pessoal-resultado.tsx
├── pessoa-fisica/fgts/resultado/_components/fgts-resultado.tsx
├── pessoa-fisica/home-equity/resultado/_components/home-equity-resultado.tsx
├── pessoa-juridica/antecipacao-recebiveis/resultado/_components/antecipacao-recebiveis-resultado.tsx
├── pessoa-juridica/capital-giro/resultado/_components/capital-giro-resultado.tsx
├── financiamentos/imovel/resultado/_components/financiamento-imovel-resultado.tsx
└── financiamentos/veiculo/resultado/_components/financiamento-veiculo-resultado.tsx
    (todos os 9 arquivos acima)               ← trocar chamada de qualifySimulation por link/redirect para /simulador/qualificacao/[id]

apps/console/src/app/(private)/simulations/
├── queries.ts                                ← adicionar 5 campos ao SELECT
└── _components/
    ├── simulations-list.tsx                  ← nova tabela + tabs + chamar sheet
    └── simulation-detail-sheet.tsx           ← novo componente Sheet

supabase/migrations/
└── YYYYMMDDHHMMSS_add_personal_fields_to_simulations.sql
```

---

## Restrições de implementação

- `simulations-list.tsx` é Client Component — filtragem de tabs é local (sem round-trip ao banco por tab)
- `simulation-detail-sheet.tsx` é Client Component — recebe `SimulationRow` como prop
- CPF mascarado apenas na exibição — armazenado sem máscara no banco
- CET anual e Total a pagar calculados no frontend, não armazenados
- Nenhuma validação de CPF (apenas máscara visual no input)
- Página `/simulador/qualificacao/[id]` usa `createServiceClient()` para atualizar a simulação sem contexto de tenant (ou injeta x-tenant-id via header como já feito nas actions da store)
