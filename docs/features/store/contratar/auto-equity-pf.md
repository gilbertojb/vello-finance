# Spec — Contratação: Auto Equity Pessoa Física (Crédito com Garantia de Veículo PF)

**Data:** 2026-05-17
**Slug da esteira:** `auto_equity`
**Rota:** `/contratar/auto-equity`
**Status:** Aprovado

---

## Simulação

Formulário existente em `/simulador/pessoa-fisica/veiculo-em-garantia`. Sem alterações de campos.

CTA: **"Quero contratar"** → `/contratar/auto-equity?productId={uuid}&simulationId={uuid}`

---

## Etapa 1 — Dados para Análise

### Steps

```
operacao → dados-pessoais → renda-ocupacao → retorno
```

---

### Step 1: `operacao` — Informações sobre a Operação

| Campo | Tipo | Regra |
|---|---|---|
| Tipo de veículo | select | Carro, Caminhão, Moto |
| Veículo financiado? | select (Sim/Não) | Se Sim → **bloquear**: "No momento, não conseguimos seguir com essa operação porque o veículo informado ainda possui um financiamento ativo. Para avançarmos, ele precisa estar totalmente quitado." |
| Placa do veículo | text | Letras e números, validação de formato de placa (AAA-0000 ou AAA-0A00) |
| Ano de fabricação | select | Selecionar ano. Bloquear se veículo tiver mais de 15 anos: "Este veículo não atende aos requisitos mínimos de ano de fabricação." |
| Motivo do crédito | select | Quitar dívidas pessoais, Quitar dívidas da empresa, Investir em negócio próprio, Reforma ou construção, Aquisição de outro imóvel, Projetos pessoais, Outros |

---

### Step 2: `dados-pessoais` — Dados Pessoais

> Headline: "Não se preocupe — a cada etapa concluída, sua proposta fica salva automaticamente."

| Campo | Tipo | Regra |
|---|---|---|
| Nome completo | text | Pré-preenchido da simulação, editável. Mínimo 2 palavras |
| CPF | text | Obrigatório, validação automática |
| Data de nascimento | date | Bloquear se ≥ 70 anos |
| E-mail | email | Obrigatório |
| WhatsApp | tel | Pré-preenchido, editável. DDI +55 fixo |
| Nome da mãe | text | Obrigatório. Mínimo 2 palavras |

---

### Step 3: `renda-ocupacao` — Renda e Ocupação

| Campo | Tipo | Regra |
|---|---|---|
| Tipo de ocupação | select | CLT, Autônomo, Empresário, Aposentado, Servidor Público |
| Renda mensal | currency | R$ automático |
| Tempo na ocupação | select | Menos de 1 ano, 1 a 3 anos, 3 a 5 anos, Mais de 5 anos |

---

### Step 4: `retorno` — Confirmação e Retorno

Resumo da simulação:
- Crédito solicitado
- Parcelamento
- Juros mensais
- Valor da parcela

Mensagem: *"Tudo certo por aqui! Recebemos suas informações e já iniciamos a análise da sua proposta. Em breve, você vai receber um retorno direto no WhatsApp e no seu e-mail — é só ficar de olho!"*

`finalizeEtapa1` → status `proposta_criada`.

---

## Etapa 2 — Documentos e Dados Bancários

Acessada via `/proposta/[proposalId]/documentos`.

### Steps

```
dados-bancarios → documentos-pessoais → documentos-veiculo → finalizado
```

---

### Step 5: `dados-bancarios`

Banco (lista cadastrada), Agência, Conta-corrente, Chave PIX (opcional), Checkbox confirmação de titularidade.

Erro: "A conta informada não corresponde ao titular do crédito. Utilize uma conta bancária em seu nome."

---

### Step 6: `documentos-pessoais` — Documentos Pessoais

Checklist:
- RG e CPF (frente e verso)
- CNH (frente e verso)
- Comprovante de estado civil
- Comprovante de endereço (últimos 3 meses)

---

### Step 7: `documentos-veiculo` — Documentos do Veículo

Checklist:
- CRLV do veículo
- Foto traseira do veículo (JPEG)
- Foto da placa traseira (JPEG)
- Foto do chassi (JPEG)

Botão "Finalizar Envio" → `finalizeEtapa2` → `/proposta/[proposalId]/finalizado`.

---

### Step 8: `finalizado`

Mensagem: *"Recebemos seus documentos, obrigado por compartilhar com a gente! Agora, nossa equipe jurídica e os analistas de crédito estão cuidando da análise para que possamos seguir para a próxima etapa: a formalização do contrato. Fique atento ao seu e-mail e WhatsApp, em breve entraremos em contato com os próximos passos."*
