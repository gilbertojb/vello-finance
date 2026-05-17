# Spec — Contratação: Financiamento Imobiliário

**Data:** 2026-05-17
**Slug da esteira:** `financiamento_imovel`
**Rota:** `/contratar/financiamento-imovel`
**Status:** Aprovado

---

## Simulação

Formulário existente em `/simulador/financiamentos/imovel`.

**Refinamentos do documento:**
- Parcelas disponíveis: 80, 180, 220, 230, 240 meses (atualizar select)

CTA: **"Quero contratar"** → `/contratar/financiamento-imovel?productId={uuid}&simulationId={uuid}`

---

## Etapa 1 — Dados para Análise

> Nota: o documento descreve este fluxo para Pessoa Jurídica, mas o mesmo padrão se aplica para Pessoa Física — campos de empresa são condicionais ao tipo de solicitante.

### Steps

```
operacao → dados-solicitante → atividade-faturamento → dados-socios → dados-vendedor → endereco-imovel → retorno
```

---

### Step 1: `operacao` — Informações sobre a Operação

| Campo | Tipo | Regra |
|---|---|---|
| Tipo de imóvel | select | Casa de rua, Casa de condomínio, Apartamento, Terreno, Escritório, Loja, Estúdio, Flat |
| Imóvel financiado? | select (Sim/Não) | Se Sim: "Valor pago até agora" (currency). Se > 40% do valor → **bloquear** |
| Matrícula | text | Apenas números |

---

### Step 2: `dados-solicitante` — Dados do Solicitante / Empresa

> Headline: "Não se preocupe — a cada etapa concluída, sua proposta fica salva automaticamente."

**Para Pessoa Jurídica:**
| Campo | Tipo | Regra |
|---|---|---|
| Razão Social | text | Letras e números |
| CNPJ | text | Apenas números |
| Tempo de empresa | select | Menos de 3 anos → **bloquear**, Mais de 3 anos |

---

### Step 3: `atividade-faturamento` — Atividade e Faturamento

| Campo | Tipo | Regra |
|---|---|---|
| Atividade da empresa | text | Livre |
| Faturamento anual | currency | R$ automático |
| Produtos ou serviços oferecidos | text | Livre |

---

### Step 4: `dados-socios` — Dados dos Sócios

Por sócio:
- Nome completo
- CPF (validação)
- Data de nascimento (bloquear ≥ 70 anos)
- E-mail
- WhatsApp
- Estado civil: se Casado → dados do cônjuge

---

### Step 5: `dados-vendedor` — Dados do Vendedor (Proprietário do Imóvel)

| Campo | Tipo | Regra |
|---|---|---|
| Nome completo | text | Mínimo 2 palavras |
| CPF | text | Validação automática |
| Data de nascimento | date | Bloquear ≥ 70 anos |
| E-mail | email | Obrigatório |
| WhatsApp | tel | DDI +55 |
| Estado civil | select | Se Casado → dados do cônjuge do vendedor |

---

### Step 6: `endereco-imovel` — Endereço do Imóvel

CEP (lookup automático), Rua, Número, Complemento (opcional), Bairro, Cidade, UF.

---

### Step 7: `retorno` — Confirmação e Retorno

Resumo da simulação. `finalizeEtapa1` → status `proposta_criada`.

Mensagem: *"Obrigado pelas informações! Em breve teremos o retorno de sua proposta, fique atento, iremos encaminhar sua resposta no WhatsApp e e-mail."*

---

## Etapa 2 — Documentos

### Steps

```
dados-bancarios-vendedor → documentos-empresa → documentos-imovel → finalizado
```

---

### Step 8: `dados-bancarios-vendedor` — Dados Bancários do Vendedor

Banco, Agência, Conta-corrente, Chave PIX, Checkbox confirmação titularidade da conta no nome do vendedor.

---

### Step 9: `documentos-empresa` — Documentos da Empresa

Checklist:
- CNPJ
- Contrato Social atualizado
- Comprovante de endereço da empresa
- Balanço Patrimonial do último ano
- Balancete dos últimos 3 meses
- DRE do último ano ou Simples Nacional
- Relação dos últimos 12 faturamentos (com assinatura do contador)
- Extrato bancário PJ (últimos 3 meses)
- RG e CPF (frente e verso) dos sócios

---

### Step 10: `documentos-imovel` — Documentos do Imóvel

Checklist:
- Matrícula atualizada
- IPTU com metragens
- CND de Tributos Imobiliários (até 30 dias)
- Comprovante de endereço do imóvel
- Fotos do imóvel — externas e internas (JPEG)
- Contrato de Aluguel (se aplicável)

Botão "Finalizar Envio" → `finalizeEtapa2` → `/proposta/[proposalId]/finalizado`.

---

### Step 11: `finalizado`

Mensagem: *"Obrigado pelas informações e documentos! Nossa equipe jurídica e os analistas de crédito irão realizar a análise para seguir para o contrato. Fique atento ao seu e-mail e WhatsApp."*
