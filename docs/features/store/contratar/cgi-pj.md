# Spec — Contratação: CGI Pessoa Jurídica (Crédito com Garantia de Imóvel PJ)

**Data:** 2026-05-17
**Slug da esteira:** `home_equity_pj`
**Rota:** `/contratar/home-equity-pj`
**Status:** Aprovado

---

## Simulação

Formulário existente em `/simulador/pessoa-juridica/imovel-em-garantia`.

Campo adicional (alinhado com o CGI PF):

| Campo novo | Tipo | Regra |
|---|---|---|
| Esse crédito já foi solicitado em outro local? | select (Sim/Não) | Se Sim: subcampos "Em qual local?" e "Valor liberado" |

CTA: **"Quero contratar"** → `/contratar/home-equity-pj?productId={uuid}&simulationId={uuid}`

---

## Etapa 1 — Dados para Análise

### Steps

```
operacao → dados-empresa → atividade-faturamento → dados-socios → endereco-garantia → endereco-empresa → retorno
```

---

### Step 1: `operacao` — Informações sobre a Operação

| Campo | Tipo | Regra |
|---|---|---|
| Tipo de imóvel | select | Casa de rua, Casa de condomínio, Apartamento, Terreno, Escritório, Loja, Estúdio, Flat |
| Imóvel financiado? | select (Sim/Não) | Se Sim: "Valor pago até agora" (currency). Se > 40% do imóvel → **bloquear** |
| Matrícula | text | Apenas números |
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
| Faturamento anual | currency | R$ automático |
| Quantidade de sócios | number | Ao informar N, exibir N blocos de campos de sócio abaixo (inline neste step ou como sub-seção) |

**Campos de cada sócio (inline):**
- Nome completo (mínimo 2 palavras)
- CPF (validação automática)
- Data de nascimento (bloquear ≥ 70 anos)
- E-mail
- WhatsApp (DDI +55 fixo)

---

### Step 4: `dados-socios` — Dados dos Sócios (detalhados)

Estado civil de cada sócio:
| Campo | Tipo | Regra |
|---|---|---|
| Estado civil | select (Casado/Solteiro/Outros) | Se Casado: mesmos dados pessoais do cônjuge |

---

### Step 5: `endereco-garantia` — Endereço da Garantia (Imóvel)

CEP, Rua, Número, Complemento (opcional), Bairro, Cidade, Estado.
CEP lookup via `/api/cep/[cep]` com auto-preenchimento e edição permitida.

---

### Step 6: `endereco-empresa` — Endereço da Empresa

Mesmos campos do step anterior. Checkbox "Mesmo endereço da garantia".

---

### Step 7: `retorno` — Confirmação e Retorno

Resumo da simulação + mensagem de análise. `finalizeEtapa1` → status `proposta_criada`.

---

## Etapa 2 — Documentos e Dados Bancários

Acessada via `/proposta/[proposalId]/documentos`.

### Steps

```
dados-bancarios → documentos-empresa → documentos-pessoais-socios → documentos-imovel → finalizado
```

---

### Step 8: `dados-bancarios`

Banco (lista cadastrada), Agência, Conta-corrente, Chave PIX (opcional), Checkbox confirmação de titularidade.

---

### Step 9a: `documentos-empresa` — Documentos da Empresa

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

### Step 9b: `documentos-pessoais-socios` — Docs Pessoais dos Sócios

Por sócio (e cônjuge, se aplicável):
- RG e CPF (frente e verso)
- Comprovante de estado civil
- Comprovante de endereço (últimos 3 meses)
- Declaração do IR com recibo de entrega

---

### Step 10: `documentos-imovel` — Documentos do Imóvel

Checklist:
- Matrícula atualizada
- IPTU com metragens
- CND de Tributos Imobiliários (até 30 dias)
- Comprovante de endereço do imóvel
- Fotos do imóvel (externas e internas – JPEG)
- Contrato de Aluguel (se aplicável)

Botão "Finalizar Envio" → `finalizeEtapa2` → `/proposta/[proposalId]/finalizado`.

---

### Step 11: `finalizado`

Mensagem de conclusão: *"Agradecemos pelo envio das informações e documentos! Agora, nossa equipe jurídica e os analistas de crédito darão continuidade à análise para avançarmos para a etapa de contrato."*
