# Spec — Contratação: Capital de Giro Pessoa Jurídica

**Data:** 2026-05-17
**Slug da esteira:** `capital_giro`
**Rota:** `/contratar/capital-de-giro`
**Status:** Aprovado

---

## Simulação

Formulário existente em `/simulador/pessoa-juridica/capital-de-giro`. Sem alterações.

CTA: **"Quero contratar"** → `/contratar/capital-de-giro?productId={uuid}&simulationId={uuid}`

---

## Etapa 1 — Dados para Análise

### Steps

```
operacao → dados-empresa → dados-socios → garantia → retorno
```

---

### Step 1: `operacao` — Informações sobre a Operação

| Campo | Tipo | Regra |
|---|---|---|
| Tipo de empresa | select | LTDA, EPP, S.A., Outros. **MEI não é aceito** — se selecionado: **bloquear**: "Esta linha de crédito não está disponível para MEI." |
| Data de fundação (abertura do CNPJ) | date | Se empresa < 3 anos → **bloquear**: "A empresa precisa ter pelo menos 3 anos de existência para essa linha de crédito." |
| Faturamento dos últimos 12 meses | currency | Mínimo R$ 250.000,00. Se < R$ 250 mil → **bloquear**: "O faturamento mínimo exigido para essa linha de crédito é de R$ 250 mil." |
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

| Campo | Tipo | Regra |
|---|---|---|
| Quantidade de sócios | number | Exibir N blocos de campos |

Por sócio:
- Nome completo (mínimo 2 palavras)
- CPF (validação automática)
- Data de nascimento (bloquear ≥ 70 anos)
- E-mail
- WhatsApp (DDI +55, validação ativa)
- Estado civil: se Casado → mesmos dados pessoais do cônjuge

---

### Step 4: `garantia` — Garantia na Operação

| Campo | Tipo | Regra |
|---|---|---|
| Sua empresa possui alguma garantia real ou vinculada? | select (Sim/Não) | Se Sim → exibir campo: "Qual tipo de garantia você possui?" |
| Tipo de garantia | select | Duplicatas, Cartões de Crédito, Aplicações Financeiras, Domicílio Simples, Imóvel Empresarial, Recebíveis |

> Nota de fluxo: se garantia for "Imóvel Empresarial", os documentos do imóvel serão solicitados na Etapa 2. Se for "Recebíveis", seguir padrão de antecipação de recebíveis para documentos.

---

### Step 5: `retorno` — Confirmação e Retorno

Resumo da simulação + mensagem de análise.

Mensagem: *"Obrigado pelas informações! Agora é com a gente, sua proposta já está em análise. Fique de olho no WhatsApp e no seu e-mail."*

`finalizeEtapa1` → status `proposta_criada`.

---

## Etapa 2 — Documentos e Dados Bancários

### Steps

```
dados-bancarios → documentos-empresa → documentos-pessoais-socios → documentos-garantia (se houver) → finalizado
```

---

### Step 6: `dados-bancarios`

Banco, Agência, Conta-corrente, Chave PIX, Checkbox titularidade.

---

### Step 7: `documentos-empresa`

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

### Step 8: `documentos-pessoais-socios`

Por sócio (e cônjuge, se aplicável):
- RG e CPF (frente e verso)
- Comprovante de estado civil
- Comprovante de endereço (últimos 3 meses)
- Declaração do IR com recibo de entrega

---

### Step 9: `documentos-garantia` (condicional)

Exibido somente se o cliente informou ter garantia. Documentos variam conforme tipo selecionado:

- **Imóvel:** Matrícula, IPTU, CND, comprovante de endereço, fotos
- **Recebíveis:** Extrato de recebíveis, contratos, notas fiscais
- **Outros:** Documento comprobatório do ativo

---

### Step 10: `finalizado`

Mensagem: *"Agradecemos pelo envio das informações e documentos! Agora, nossa equipe jurídica e os analistas de crédito darão continuidade à análise. Fique de olho no seu e-mail e WhatsApp."*
