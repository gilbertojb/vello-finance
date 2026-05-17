# Design — Fluxos de Contratação por Produto

**Data:** 2026-05-17
**App:** `apps/store`
**Status:** Aprovado pelo usuário — aguardando review dos specs por produto

---

## Visão Geral

Implementação dos fluxos de contratação para todos os produtos da Vello Store. Cada produto tem um wizard multi-step que persiste dados no Supabase a cada etapa.

---

## Decisões de Design

| Questão | Decisão |
|---|---|
| Routing do wizard | searchParam `?step={slug}` em `/contratar/[productTypeSlug]` |
| Persistência | Supabase `proposals` table, salvo a cada step via Server Action |
| Vínculo com produtos | `product_type_slug` para routing + `product_id` UUID para referência |
| Etapa 2 (documentos) | Rota separada `/proposta/[proposalId]/documentos` |
| Autenticação | Nenhuma — acesso via UUID da proposta na URL |
| Upload de documentos | Supabase Storage, bucket `proposal-documents` (privado) |
| CEP lookup | API existente `/api/cep/[cep]` |

---

## Arquivos de Spec por Produto

| Produto | Slug | Spec |
|---|---|---|
| CGI Pessoa Física | `home_equity` | `docs/features/store/contratar/cgi-pf.md` |
| CGI Pessoa Jurídica | `home_equity_pj` | `docs/features/store/contratar/cgi-pj.md` |
| Auto Equity PF | `auto_equity` | `docs/features/store/contratar/auto-equity-pf.md` |
| Auto Equity PJ | `auto_equity_pj` | `docs/features/store/contratar/auto-equity-pj.md` |
| FGTS | `fgts` | `docs/features/store/contratar/fgts.md` |
| Capital de Giro PJ | `capital_giro` | `docs/features/store/contratar/capital-de-giro-pj.md` |
| Antecipação de Recebíveis PJ | `antecipacao_recebiveis` | `docs/features/store/contratar/antecipacao-recebiveis-pj.md` |
| Financiamento Imóvel | `financiamento_imovel` | `docs/features/store/contratar/financiamento-imovel.md` |
| Financiamento Veículo | `financiamento_veiculo` | `docs/features/store/contratar/financiamento-veiculo.md` |
| Consignado CLT | `consignado_privado` | `docs/features/store/contratar/consignado-clt.md` |

Arquitetura compartilhada: `docs/features/store/contratar/ARCHITECTURE.md`

---

## Fora de Escopo

- Empréstimo Pessoal — sem fluxo de contratação no documento
- Conta de Luz — sem fluxo de contratação no documento
- Consignado CLT Etapa 2 — não especificada no documento
- Automações de WhatsApp/email (desconsideradas conforme instrução)

---

## Banco de Dados — Novas Tabelas

- `proposals` — proposta de crédito com form_data JSONB e status
- `proposal_documents` — documentos enviados, referenciados por tipo

Ver schema completo em `ARCHITECTURE.md`.

---

## Refinamentos de Simulação

| Produto | Mudança |
|---|---|
| CGI PF/PJ | Adicionar campo "Já solicitou em outro local?" |
| FGTS | CTA da categoria vai direto para /contratar/fgts |
| Conta de Luz | Atualizar lista de distribuidoras conforme documento |
| Financiamento Imóvel | Atualizar opções de parcelas: 80, 180, 220, 230, 240 |
