# Spec — Contratação: Consignado CLT

**Data:** 2026-05-17
**Slug da esteira:** `consignado_privado`
**Rota:** `/contratar/consignado-clt`
**Status:** Aprovado

---

## Simulação

O fluxo de simulação para Consignado CLT está em `/simulador/pessoa-fisica/consignado`. O cliente acessa a contratação pelo CTA do resultado da simulação.

CTA: **"Quero contratar"** → `/contratar/consignado-clt?productId={uuid}&simulationId={uuid}`

---

## Etapa 1 — Qualificação e Originação

O Consignado CLT possui um **pré-filtro rigoroso** antes de coletar dados.

### Steps

```
pre-filtro → autorizacao-dataprev → dados-pessoais → dados-profissionais → dados-bancarios → retorno
```

---

### Step 1: `pre-filtro` — Qualificação Inicial

Objetivo: eliminar leads inviáveis imediatamente.

| Campo | Tipo | Regra |
|---|---|---|
| Você trabalha com carteira assinada (CLT)? | select (Sim/Não) | Não → **bloquear** |
| Seu vínculo está ativo (sem aviso prévio)? | select (Sim/Não) | Não → **bloquear** |
| Tempo de empresa ≥ 6 meses? | select (Sim/Não) | Não → **bloquear** |
| Sua idade está entre 21 e 65 anos? | select (Sim/Não) | Não → **bloquear** |

**Mensagem de bloqueio:** *"Infelizmente, não atende aos requisitos mínimos para esta modalidade de crédito no momento. Mas existem outras opções disponíveis para você!"* + botão "Ver outros produtos".

Se todos Sim → habilitar "Prosseguir".

---

### Step 2: `autorizacao-dataprev` — Autorização Dataprev

| Campo | Tipo | Regra |
|---|---|---|
| Autorização | checkbox | "Autorizo a consulta dos meus dados via Dataprev para análise de crédito consignado." Obrigatório |

---

### Step 3: `dados-pessoais` — Dados Pessoais

> Headline: "Não se preocupe — a cada etapa concluída, sua proposta fica salva automaticamente."

| Campo | Tipo | Regra |
|---|---|---|
| Nome completo | text | Pré-preenchido da simulação. Mínimo 2 palavras |
| CPF | text | Validação automática |
| Data de nascimento | date | Bloquear < 21 anos ou > 65 anos |
| E-mail | email | Obrigatório |
| WhatsApp | tel | Pré-preenchido. DDI +55 |

---

### Step 4: `dados-profissionais` — Dados Profissionais

| Campo | Tipo | Regra |
|---|---|---|
| Empresa atual | text | Obrigatório |
| Tempo de empresa | select | Menos de 6 meses → bloquear, 6 meses a 1 ano, 1 a 3 anos, 3 a 5 anos, Mais de 5 anos |
| Tipo de contrato | text | Fixo: "CLT (Carteira Assinada)" — exibição apenas informativa |

---

### Step 5: `dados-bancarios` — Dados Bancários

| Campo | Tipo | Regra |
|---|---|---|
| Banco | select | Lista de bancos cadastrados |
| Agência | text | Apenas números |
| Conta-corrente | text | Apenas números |
| Chave PIX | text | Opcional |
| Confirmação | checkbox | "A conta deve estar no meu nome." Obrigatório |

Erro: "A conta informada não corresponde ao titular do crédito. Utilize uma conta bancária em seu nome."

---

### Step 6: `retorno` — Confirmação e Retorno

Resumo da simulação. `finalizeEtapa1` → status `proposta_criada`.

Mensagem: *"Muito obrigado! Recebemos os seus dados e vamos iniciar a análise. Fique atento ao WhatsApp e e-mail, em breve você recebe um retorno."*

---

## Etapa 2

A documentação não especifica Etapa 2 para o Consignado CLT. Por se tratar de crédito baseado em margem consignável verificável via Dataprev, não há envio de documentos físicos neste fluxo.

Se necessário, a Etapa 2 será especificada em sessão futura.
