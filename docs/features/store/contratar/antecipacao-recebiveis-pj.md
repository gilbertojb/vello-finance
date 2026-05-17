# Spec — Contratação: Antecipação de Recebíveis Pessoa Jurídica

**Data:** 2026-05-17
**Slug da esteira:** `antecipacao_recebiveis`
**Rota:** `/contratar/antecipacao-recebiveis`
**Status:** Aprovado

---

## Simulação

Formulário existente em `/simulador/pessoa-juridica/antecipacao-recebiveis`. Sem alterações.

CTA: **"Quero contratar"** → `/contratar/antecipacao-recebiveis?productId={uuid}&simulationId={uuid}`

---

## Etapa 1 — Dados para Análise

### Steps

```
operacao → dados-empresa → dados-socios → retorno
```

---

### Step 1: `operacao` — Informações sobre a Operação

| Campo | Tipo | Regra |
|---|---|---|
| Tipo de recebível | select | Maquininha (Cartão de Crédito), Duplicata, Nota Fiscal Eletrônica (NF-e), Contrato a Receber |
| Data de fundação (abertura do CNPJ) | date | Se empresa < 3 anos → **bloquear**: "A empresa precisa ter pelo menos 3 anos de existência para essa linha de crédito." |
| Faturamento dos últimos 12 meses | currency | Mínimo R$ 120.000,00. Se < R$ 120 mil → **bloquear**: "O faturamento mínimo exigido para essa linha de crédito é de R$ 120 mil." |
| Motivo do crédito | select | Quitar dívidas pessoais, Quitar dívidas da empresa, Investir em negócio próprio, Reforma ou construção, Aquisição de outro imóvel, Projetos pessoais, Outros |

---

### Step 2: `dados-empresa` — Dados da Empresa

> Headline: "Não se preocupe — a cada etapa concluída, sua proposta fica salva automaticamente."

| Campo | Tipo | Regra |
|---|---|---|
| Razão Social | text | Letras e números |
| CNPJ | text | Apenas números, validação automática |
| Atividade da empresa | text | Livre |
| Produtos ou serviços oferecidos | text | Livre |
| Faturamento anual | currency | R$ automático |

---

### Step 3: `dados-socios` — Dados dos Sócios

Por sócio (quantidade informada no step anterior ou campo aqui):
- Nome completo (mínimo 2 palavras, pré-preenchido da simulação se disponível)
- CPF (validação automática)
- RG (obrigatório)
- Data de nascimento (bloquear ≥ 70 anos)
- E-mail
- WhatsApp (DDI +55)

---

### Step 4: `retorno` — Confirmação e Retorno

Resumo da simulação + mensagem.

Mensagem: *"Obrigado pelas informações! Agora é com a gente, sua proposta já está em análise. Fique de olho no WhatsApp e no seu e-mail."*

`finalizeEtapa1` → status `proposta_criada`.

---

## Etapa 2 — Documentos e Dados Bancários

### Steps

```
dados-bancarios → documentos-empresa → documentos-pessoais-socios → documentos-garantia → finalizado
```

---

### Step 5: `dados-bancarios`

Banco, Agência, Conta-corrente, Chave PIX, Checkbox titularidade.

---

### Step 6: `documentos-empresa`

Checklist:
- CNPJ
- Contrato Social atualizado
- Comprovante de endereço da empresa (últimos 3 meses)
- Balanço Patrimonial do último ano
- Balancete dos últimos 3 meses
- DRE do último ano ou Simples Nacional
- Relação dos últimos 12 faturamentos (com assinatura do contador)
- Extrato bancário PJ (últimos 3 meses)
- Extrato PF (últimos 3 meses)
- RG e CPF (frente e verso) dos sócios

---

### Step 7: `documentos-pessoais-socios`

Por sócio (e cônjuge, se aplicável):
- RG e CPF (frente e verso)
- Comprovante de estado civil
- Comprovante de endereço (últimos 3 meses)
- Declaração do IR com recibo de entrega

---

### Step 8: `documentos-garantia` — Documentos dos Recebíveis

Checklist varia conforme tipo de recebível selecionado na Etapa 1:

| Tipo | Documentos |
|---|---|
| Maquininha | Extrato de vendas (últimos 3 meses), contrato com adquirente |
| Duplicata | Duplicatas a receber com vencimentos |
| NF-e | Notas Fiscais Eletrônicas com XML |
| Contrato | Contratos com cronograma de recebimento |

---

### Step 9: `finalizado`

Mensagem: *"Agradecemos pelo envio das informações e documentos! Agora, nossa equipe jurídica e os analistas de crédito darão continuidade à análise para avançarmos para a etapa de contrato."*
