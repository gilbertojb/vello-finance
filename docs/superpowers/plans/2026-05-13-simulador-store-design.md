# Implementation Plan: Simulador de Crédito — Vello Store

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementação completa do simulador de crédito multiproduto na Vello Store (10 novos fluxos) e refatoração de segurança do fluxo existente (`home-equity`).

**Architecture:** Padrão "Thin Client / Fat Server" parcial.
- **Formulários:** Server Components renderizam o form (Client Component). O form valida, calcula limites (LTV), salva os dados em `sessionStorage` e navega para `/resultado`.
- **Resultados:** Server Component busca dados do produto (via `productId` na URL) e passa a taxa. Client Component lê `sessionStorage` para obter dados sensíveis (sem expor PII na URL), calcula PMT/SAC e exibe o resumo com CTA para contratação.

**Tech Stack:** Next.js 15 App Router, React (Client/Server Components), Supabase (Migrations).

---

## Task 1: Banco de Dados e Utilitários

**Files:**
- Create: `supabase/migrations/20260513120000_add_missing_product_types.sql`
- Modify: `apps/store/src/lib/utils/simulator.ts`

- [ ] **Step 1.1: Criar Migration**
Criar o arquivo SQL e inserir os novos 8 `product_types` de acordo com a spec: `home_equity_pj`, `auto_equity_pj`, `capital_giro`, `antecipacao_recebiveis`, `financiamento_imovel`, `financiamento_veiculo`, `emprestimo_pessoal`, `conta_luz`.

- [ ] **Step 1.2: Atualizar Utilitários de Simulação**
No arquivo `simulator.ts`, adicionar o dicionário `MONTHLY_RATES` com as taxas fixas mensais e a função `calcSAC` para cálculos do sistema de amortização constante. Manter as funções existentes.

- [ ] **Step 1.3: Commit**
```bash
git add supabase/migrations apps/store/src/lib/utils/simulator.ts
git commit -m "feat(store): migration product_types e utils do simulador"
```

---

## Task 2: Refatoração Home Equity PF e Rota PF

**Files:**
- Modify: `apps/store/src/app/(store)/simulador/pessoa-fisica/page.tsx`
- Modify: `apps/store/src/app/(store)/simulador/pessoa-fisica/home-equity/_components/home-equity-form.tsx`
- Modify: `apps/store/src/app/(store)/simulador/pessoa-fisica/home-equity/resultado/page.tsx`
- Modify: `apps/store/src/app/(store)/simulador/pessoa-fisica/home-equity/resultado/_components/home-equity-resultado.tsx`

- [ ] **Step 2.1: Atualizar Seletores Pessoa Física**
Em `pessoa-fisica/page.tsx`, adicionar as rotas `/simulador/pessoa-fisica/emprestimo-pessoal` e `/simulador/pessoa-fisica/conta-luz`. Remover o seletor `consignado_privado`.

- [ ] **Step 2.2: Refatorar Home Equity Form**
Modificar `home-equity-form.tsx` para aceitar a prop `isPj?: boolean`. Se `isPj`, exibir o chip "Pessoa Jurídica".
Ao invés de passar `nome` e `whatsapp` via query params na URL ao enviar o formulário, gravar o payload em `sessionStorage['sim:home-equity']` (ou `sim:home-equity-pj` se `isPj`).

- [ ] **Step 2.3: Refatorar Home Equity Resultado**
Atualizar `resultado/page.tsx` para não esperar mais parâmetros sensíveis.
Em `home-equity-resultado.tsx`, ler do `sessionStorage` no `useEffect` (lidando com redirecionamento de volta ao form se estiver vazio).

- [ ] **Step 2.4: Commit**
```bash
git add apps/store/src/app/\(store\)/simulador/pessoa-fisica
git commit -m "refactor(store): home-equity usando sessionStorage e page.tsx att"
```

---

## Task 3: Home Equity PJ (Reuso)

**Files:**
- Create: `apps/store/src/app/(store)/simulador/pessoa-juridica/home-equity-pj/page.tsx`
- Create: `apps/store/src/app/(store)/simulador/pessoa-juridica/home-equity-pj/resultado/page.tsx`
- Create: `apps/store/src/app/(store)/simulador/pessoa-juridica/home-equity-pj/resultado/_components/home-equity-pj-resultado.tsx`

- [ ] **Step 3.1: Criar Rotas Home Equity PJ**
Implementar as rotas invocando o `HomeEquityForm` (passando `isPj={true}`).
O resultado deve reutilizar o componente de cálculo base ou estendê-lo lendo de `sim:home-equity-pj`.

- [ ] **Step 3.2: Commit**
```bash
git add apps/store/src/app/\(store\)/simulador/pessoa-juridica/home-equity-pj
git commit -m "feat(store): fluxo home equity pj"
```

---

## Task 4: Auto Equity PF e PJ

**Files:**
- Create: `apps/store/src/app/(store)/simulador/pessoa-fisica/auto-equity/page.tsx`
- Create: `apps/store/src/app/(store)/simulador/pessoa-fisica/auto-equity/_components/auto-equity-form.tsx`
- Create: `apps/store/src/app/(store)/simulador/pessoa-fisica/auto-equity/resultado/page.tsx`
- Create: `apps/store/src/app/(store)/simulador/pessoa-fisica/auto-equity/resultado/_components/auto-equity-resultado.tsx`
- Create: `apps/store/src/app/(store)/simulador/pessoa-juridica/auto-equity-pj/page.tsx`
- Create: `apps/store/src/app/(store)/simulador/pessoa-juridica/auto-equity-pj/resultado/page.tsx`
- Create: `apps/store/src/app/(store)/simulador/pessoa-juridica/auto-equity-pj/resultado/_components/auto-equity-pj-resultado.tsx`

- [ ] **Step 4.1: Criar Auto Equity Form**
Implementar o formulário que coleta Nome, WhatsApp, Valor do veículo (FIPE) e Valor do crédito. Validar LTV 90%. Aceitar prop `isPj`.
Salvar em `sessionStorage` (`sim:auto-equity` ou `sim:auto-equity-pj`).

- [ ] **Step 4.2: Criar Auto Equity Resultado (PF/PJ)**
Implementar componente de resultado usando Modalidade Price, exibindo Parcela, LTV e CET Anual. Criar as rotas de PF e PJ.

- [ ] **Step 4.3: Commit**
```bash
git add apps/store/src/app/\(store\)/simulador/pessoa-fisica/auto-equity apps/store/src/app/\(store\)/simulador/pessoa-juridica/auto-equity-pj
git commit -m "feat(store): fluxo auto equity pf e pj"
```

---

## Task 5: Outros Fluxos PF (FGTS, Empréstimo Pessoal, Conta Luz)

**Files:**
- Create: `apps/store/src/app/(store)/simulador/pessoa-fisica/fgts/` (page, form, result page, result component)
- Create: `apps/store/src/app/(store)/simulador/pessoa-fisica/emprestimo-pessoal/` (page, form, result page, result component)
- Create: `apps/store/src/app/(store)/simulador/pessoa-fisica/conta-luz/` (page, form, result page, result component)

- [ ] **Step 5.1: Fluxo FGTS**
Implementar form para saldo FGTS. Resultado exibe estimativa (75% do saldo) usando a taxa informativa.

- [ ] **Step 5.2: Fluxo Empréstimo Pessoal**
Implementar form solicitando valor desejado (até 10k). Resultado com cálculo Price.

- [ ] **Step 5.3: Fluxo Conta Luz**
Implementar form solicitando Distribuidora e valor (até R$ 2.100). Resultado com cálculo Price.

- [ ] **Step 5.4: Commit**
```bash
git add apps/store/src/app/\(store\)/simulador/pessoa-fisica/fgts apps/store/src/app/\(store\)/simulador/pessoa-fisica/emprestimo-pessoal apps/store/src/app/\(store\)/simulador/pessoa-fisica/conta-luz
git commit -m "feat(store): fluxos fgts, emprestimo pessoal e conta luz"
```

---

## Task 6: Outros Fluxos PJ (Antecipação Recebíveis, Capital de Giro)

**Files:**
- Create: `apps/store/src/app/(store)/simulador/pessoa-juridica/antecipacao-recebiveis/` (page, form, result page, result component)
- Create: `apps/store/src/app/(store)/simulador/pessoa-juridica/capital-giro/` (page, form, result page, result component)

- [ ] **Step 6.1: Fluxo Antecipação de Recebíveis**
Implementar form coletando tipo de recebível e valor. LTV 100%. Resultado Price.

- [ ] **Step 6.2: Fluxo Capital de Giro**
Implementar form padrão para empréstimo PJ. Resultado Price.

- [ ] **Step 6.3: Commit**
```bash
git add apps/store/src/app/\(store\)/simulador/pessoa-juridica/antecipacao-recebiveis apps/store/src/app/\(store\)/simulador/pessoa-juridica/capital-giro
git commit -m "feat(store): fluxos antecipacao recebiveis e capital giro"
```

---

## Task 7: Financiamentos (Imóvel, Veículo)

**Files:**
- Create: `apps/store/src/app/(store)/simulador/financiamentos/imovel/` (page, form, result page, result component)
- Create: `apps/store/src/app/(store)/simulador/financiamentos/veiculo/` (page, form, result page, result component)

- [ ] **Step 7.1: Fluxo Imóvel**
Implementar form exigindo entrada mínima de 20%. O cálculo e resultado devem exibir Valor Financiado, Entrada e Parcela em Modalidade Price.

- [ ] **Step 7.2: Fluxo Veículo**
Implementar form exigindo entrada mínima de 30%. O cálculo e resultado devem exibir Valor Financiado, Entrada e Parcela em Modalidade Price.

- [ ] **Step 7.3: Commit**
```bash
git add apps/store/src/app/\(store\)/simulador/financiamentos/
git commit -m "feat(store): fluxos financiamento de imovel e veiculo"
```
