# Spec — Contratação: Financiamento de Veículo Pessoa Física

**Data:** 2026-05-17
**Slug da esteira:** `financiamento_veiculo`
**Rota:** `/contratar/financiamento-veiculo`
**Status:** Aprovado

---

## Simulação

Formulário existente em `/simulador/financiamentos/veiculo`. Sem alterações relevantes.

CTA: **"Quero contratar"** → `/contratar/financiamento-veiculo?productId={uuid}&simulationId={uuid}`

---

## Etapa 1 — Dados para Análise

### Steps

```
operacao → dados-pessoais → renda-ocupacao → dados-vendedor → retorno
```

---

### Step 1: `operacao` — Informações sobre a Operação

| Campo | Tipo | Regra |
|---|---|---|
| Tipo de veículo | select | Opções a definir com time financeiro (sugestão: Carro, Moto, Caminhão, Van) |
| Veículo já financiado? | select (Sim/Não) | Se Sim e valor pago > 80% do veículo → **bloquear** |
| Placa do veículo | text | Letras e números, validação de formato |

---

### Step 2: `dados-pessoais` — Dados Pessoais

> Headline: "Não se preocupe — a cada etapa concluída, sua proposta fica salva automaticamente."

| Campo | Tipo | Regra |
|---|---|---|
| Nome completo | text | Pré-preenchido da simulação, editável. Mínimo 2 palavras |
| CPF | text | Obrigatório, validação automática |
| Data de nascimento | date | Bloquear ≥ 70 anos |
| E-mail | email | Obrigatório |
| Nome da mãe | text | Obrigatório. Mínimo 2 palavras |
| WhatsApp | tel | Pré-preenchido, editável. DDI +55 |

---

### Step 3: `renda-ocupacao` — Renda e Ocupação

| Campo | Tipo | Regra |
|---|---|---|
| Profissão / Tipo de ocupação | select | CLT, Autônomo, Empresário, Aposentado, Servidor Público |
| Renda mensal | currency | R$ automático |
| Tempo de ocupação | select | Menos de 1 ano, 1 a 3 anos, 3 a 5 anos, Mais de 5 anos |
| Empresa que trabalha | text | Obrigatório se CLT |

---

### Step 4: `dados-vendedor` — Dados do Vendedor (Proprietário do Veículo)

> Headline: "Não se preocupe — a cada etapa concluída, sua proposta fica salva automaticamente."

| Campo | Tipo | Regra |
|---|---|---|
| Nome completo | text | Mínimo 2 palavras |
| CPF | text | Validação automática |
| Data de nascimento | date | Bloquear ≥ 70 anos |
| E-mail | email | Obrigatório |
| WhatsApp | tel | DDI +55 |
| Estado civil | select | Se Casado → dados do cônjuge |

---

### Step 5: `retorno` — Confirmação e Retorno

Resumo da simulação. `finalizeEtapa1` → status `proposta_criada`.

Mensagem: *"Obrigado pelas informações! Em breve teremos o retorno de sua proposta, fique atento, iremos encaminhar sua resposta no WhatsApp e e-mail."*

---

## Etapa 2 — Documentos e Dados Bancários

### Steps

```
dados-bancarios → documentos-pessoais → documentos-veiculo → finalizado
```

---

### Step 6: `dados-bancarios`

Banco, Agência, Conta-corrente, Chave PIX, Checkbox titularidade.

---

### Step 7: `documentos-pessoais` — Documentos Pessoais

Checklist:
- RG e CPF (frente e verso)
- Comprovante de estado civil
- Comprovante de endereço (últimos 3 meses)

---

### Step 8: `documentos-veiculo` — Documentos do Veículo

Checklist:
- CRLV do veículo

Botão "Finalizar Envio" → `finalizeEtapa2` → `/proposta/[proposalId]/finalizado`.

---

### Step 9: `finalizado`

Mensagem: *"Obrigado pelas informações e documentos! Nossa equipe jurídica e os analistas de crédito irão realizar a análise para seguir para o contrato. Fique atento ao seu e-mail e WhatsApp."*
