# Spec — Contratação: FGTS (Antecipação Saque Aniversário)

**Data:** 2026-05-17
**Slug da esteira:** `fgts`
**Rota:** `/contratar/fgts`
**Status:** Aprovado

---

## Simulação

O FGTS **não tem simulação** — ao clicar no produto na tela de seleção de Pessoa Física, o cliente é redirecionado diretamente para o fluxo de contratação:

```
/contratar/fgts?productId={uuid}
```

O formulário de simulação em `/simulador/pessoa-fisica/fgts` pode ser mantido como estimativa opcional, mas a CTA primária vai direto para contratação.

---

## Etapa 1 — Dados para Análise

### Steps

```
liberacao-saque → liberacao-bancos → verificar-margem → dados-bancarios → retorno
```

---

### Step 1: `liberacao-saque` — Liberação do Saque Aniversário

| Campo | Tipo | Regra |
|---|---|---|
| Já liberou o Saque Aniversário no app do FGTS? | select (Sim/Não) | Se Sim → habilitar "Prosseguir". Se Não → exibir vídeo explicativo + descrição de como fazer. Botão "Já realizei" → habilitar "Prosseguir" |

> Nota: exibir instrução passo a passo de como ativar o Saque Aniversário no app Caixa FGTS.

---

### Step 2: `liberacao-bancos` — Autorização dos Bancos no FGTS

| Campo | Tipo | Regra |
|---|---|---|
| Já autorizou bancos no seu FGTS? | select (Sim/Não) | Se Sim → habilitar "Prosseguir". Se Não → exibir vídeo explicativo + instrução. Botão "Já realizei" → habilitar "Prosseguir" |

---

### Step 3: `verificar-margem` — Dados para Consulta de Margem

> Headline: "Não se preocupe — a cada etapa concluída, sua proposta fica salva automaticamente."

| Campo | Tipo | Regra |
|---|---|---|
| Nome completo | text | Pré-preenchido se veio da simulação, editável. Mínimo 2 palavras |
| CPF | text | Obrigatório, validação automática |
| RG | text | Obrigatório |
| Data de nascimento | date | Bloquear se ≥ 70 anos |
| E-mail | email | Obrigatório |
| WhatsApp | tel | Pré-preenchido se veio da simulação. DDI +55 |

---

### Step 4: `dados-bancarios` — Dados Bancários

| Campo | Tipo | Regra |
|---|---|---|
| Banco | select | Lista de bancos cadastrados |
| Agência | text | Apenas números |
| Conta-corrente | text | Apenas números |
| Chave PIX | text | Opcional |
| Confirmação | checkbox | "Confirmo que esta conta está em meu nome." Obrigatório. |

Erro: "A conta informada não corresponde ao titular do crédito. Utilize uma conta bancária em seu nome."

---

### Step 5: `retorno` — Confirmação e Retorno

Resumo da simulação (se veio da simulação):
- Crédito estimado
- Parcelas (informativas)
- Juros (informativos)

Mensagem: *"Recebemos seus dados e já começamos a análise! Fique de olho no WhatsApp e no e-mail, em breve você recebe um retorno."*

`finalizeEtapa1` → status `proposta_criada`.

---

## Etapa 2

O FGTS não possui Etapa 2 de documentos. Após aprovação pelo consultor, o cliente recebe o link diretamente para finalização.

### Finalização

Página `/proposta/[proposalId]/finalizado`.

Mensagem: *"Obrigado pelo envio das informações e documentos! Em breve, você receberá o link para seguir com a contratação do crédito. Fique atento ao seu e-mail e WhatsApp, entraremos em contato por lá com os próximos passos!"*
