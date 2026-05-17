# Spec — Contratação: Auto Equity Pessoa Jurídica (Crédito com Garantia de Veículo PJ)

**Data:** 2026-05-17
**Slug da esteira:** `auto_equity_pj`
**Rota:** `/contratar/auto-equity-pj`
**Status:** Aprovado

---

## Simulação

Formulário existente em `/simulador/pessoa-juridica/veiculo-em-garantia`. Sem alterações.

CTA: **"Quero contratar"** → `/contratar/auto-equity-pj?productId={uuid}&simulationId={uuid}`

---

## Etapa 1 — Dados para Análise

### Steps

```
operacao → dados-empresa → atividade-faturamento → dados-socios → retorno
```

---

### Step 1: `operacao` — Informações sobre a Operação

| Campo | Tipo | Regra |
|---|---|---|
| Tipo de veículo | select | Carro, Caminhão, Moto |
| Veículo financiado? | select (Sim/Não) | Se Sim → **bloquear**: "No momento, não conseguimos seguir com essa operação porque o veículo informado ainda possui um financiamento ativo." |
| Placa do veículo | text | Validação de formato de placa |
| Ano de fabricação | select | Bloquear se > 15 anos: "Este veículo não atende aos requisitos mínimos de ano de fabricação." |
| Motivo do crédito | select | Quitar dívidas pessoais, Quitar dívidas da empresa, Investir em negócio próprio, Reforma ou construção, Aquisição de outro imóvel, Projetos pessoais, Outros |

---

### Step 2: `dados-empresa` — Dados da Empresa

> Headline: "Não se preocupe — a cada etapa concluída, sua proposta fica salva automaticamente."

| Campo | Tipo | Regra |
|---|---|---|
| Razão Social | text | Letras e números |
| CNPJ | text | Apenas números, validação automática |
| Tempo de empresa | select | Menos de 3 anos → **bloquear**: "É necessário ter no mínimo 3 anos de empresa para esta linha de crédito.", Mais de 3 anos |

---

### Step 3: `atividade-faturamento` — Atividade e Faturamento

| Campo | Tipo | Regra |
|---|---|---|
| Atividade da empresa | text | Livre |
| Faturamento mensal | currency | R$ automático |

---

### Step 4: `dados-socios` — Dados dos Sócios

| Campo | Tipo | Regra |
|---|---|---|
| Quantidade de sócios | number | Exibir N blocos de campos |

Por sócio:
- Nome completo (mínimo 2 palavras)
- CPF (validação automática)
- Data de nascimento (bloquear ≥ 70 anos)
- E-mail
- WhatsApp (DDI +55)
- Estado civil: se Casado → mesmos dados pessoais do cônjuge

---

### Step 5: `retorno` — Confirmação e Retorno

Resumo da simulação. Mensagem: *"Tudo certo por aqui! Recebemos suas informações e já iniciamos a análise da sua proposta."*

`finalizeEtapa1` → status `proposta_criada`.

---

## Etapa 2 — Documentos e Dados Bancários

### Steps

```
dados-bancarios → documentos-empresa → documentos-pessoais-socios → documentos-veiculo → finalizado
```

---

### Step 6: `dados-bancarios`

Banco, Agência, Conta-corrente, Chave PIX, Checkbox titularidade.

---

### Step 7: `documentos-empresa`

Checklist:
- CNPJ
- Contrato Social atualizado
- Comprovante de endereço da empresa
- Balanço Patrimonial do último ano
- Balancete dos últimos 3 meses
- DRE do último ano ou Simples Nacional
- Relação dos últimos 12 faturamentos (com assinatura do contador)
- Extrato bancário PJ (últimos 3 meses)
- Fotos da empresa (fachada e interior, JPEG)
- RG e CPF (frente e verso) dos sócios

---

### Step 8: `documentos-pessoais-socios` — Docs Pessoais dos Sócios

Por sócio (e cônjuge, se aplicável):
- RG e CPF (frente e verso)
- Comprovante de estado civil
- Comprovante de endereço (últimos 3 meses)
- Declaração do IR com recibo de entrega

---

### Step 9: `documentos-veiculo` — Documentos do Veículo

Checklist:
- CRLV do veículo
- Foto traseira (JPEG)
- Foto da placa traseira (JPEG)
- Foto do chassi (JPEG)

Botão "Finalizar Envio" → `finalizeEtapa2` → `/proposta/[proposalId]/finalizado`.

---

### Step 10: `finalizado`

Mensagem: *"Recebemos seus documentos, obrigado! Agora, nossa equipe jurídica e os analistas de crédito estão cuidando da análise para seguir para a formalização do contrato."*
