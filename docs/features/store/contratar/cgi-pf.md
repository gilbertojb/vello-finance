# Spec — Contratação: CGI Pessoa Física (Crédito com Garantia de Imóvel)

**Data:** 2026-05-17
**Slug da esteira:** `home_equity`
**Rota:** `/contratar/home-equity`
**Status:** Aprovado

---

## Simulação (refinamentos)

O formulário de simulação existente em `/simulador/pessoa-fisica/imovel-em-garantia` recebe os seguintes campos adicionais do documento:

| Campo novo | Tipo | Regra |
|---|---|---|
| Esse crédito já foi solicitado em outro local? | select (Sim/Não) | Se Sim: exibir subcampos "Em qual local?" (texto livre) e "Valor liberado" (currency) |

CTA no resultado: **"Quero contratar"** → `/contratar/home-equity?productId={uuid}&simulationId={uuid}`

---

## Etapa 1 — Dados para Análise

### Steps da Etapa 1

```
operacao → dados-pessoais → endereco-garantia → endereco-residencial → renda-ocupacao → retorno
```

---

### Step 1: `operacao` — Informações sobre a Operação

| Campo | Tipo | Regra de negócio |
|---|---|---|
| Tipo de imóvel | select | Casa de rua, Casa de condomínio, Apartamento, Terreno, Escritório, Loja, Estúdio, Flat |
| Imóvel financiado? | select (Sim/Não) | Se Sim: exibir campo "Valor pago até agora" (currency). Se valor pago > 40% do valor do imóvel → **bloquear**: "No momento, não podemos seguir. O imóvel possui financiamento superior a 40% do valor." |
| Matrícula | text | Aceitar apenas números |
| Motivo do crédito | select | Quitar dívidas pessoais, Quitar dívidas da empresa, Investir em negócio próprio, Reforma ou construção, Aquisição de outro imóvel, Projetos pessoais, Outros |

Ao prosseguir: `createProposal` com `product_type_slug = 'home_equity'`, retorna `proposalId`.

---

### Step 2: `dados-pessoais` — Dados Pessoais

> Headline: "Não se preocupe — a cada etapa concluída, sua proposta fica salva automaticamente."

| Campo | Tipo | Regra de negócio |
|---|---|---|
| Nome completo | text | Pré-preenchido da simulação, editável. Mínimo 2 palavras |
| CPF | text | Obrigatório, validação automática (algoritmo) |
| Data de nascimento | date | Obrigatório. Calcular idade: bloquear se ≥ 70 anos com mensagem "Esta operação não está disponível para pessoas com 70 anos ou mais." |
| E-mail | email | Obrigatório |
| WhatsApp | tel | Pré-preenchido da simulação, editável. DDI +55 fixo |
| Estado civil | select (Casado/Solteiro/Outros) | Se Casado: exibir seção "Dados do cônjuge" com os mesmos campos: Nome, CPF, Nascimento, E-mail, WhatsApp |

---

### Step 3: `endereco-garantia` — Endereço da Garantia (Imóvel)

| Campo | Tipo | Regra |
|---|---|---|
| CEP | text | Obrigatório. Ao digitar 8 dígitos: buscar `/api/cep/[cep]` e preencher automaticamente. Exibir loading. |
| Rua | text | Auto-preenchido pelo CEP, editável |
| Número | text | Obrigatório |
| Complemento | text | Opcional |
| Bairro | text | Auto-preenchido, editável |
| Cidade | text | Auto-preenchido, editável |
| Estado | text | Auto-preenchido, editável |

---

### Step 4: `endereco-residencial` — Endereço Residencial

Mesmos campos do step anterior. Exibir checkbox "Mesmo endereço da garantia" para copiar automaticamente.

---

### Step 5: `renda-ocupacao` — Renda e Ocupação

| Campo | Tipo | Regra |
|---|---|---|
| Tipo de ocupação | select | CLT, Autônomo, Empresário, Aposentado, Servidor Público |
| Profissão | text | Exibir somente se tipo = CLT |
| Renda mensal | currency | R$ automático, apenas números |
| Tempo na ocupação | select | Menos de 1 ano, 1 a 3 anos, 3 a 5 anos, Mais de 5 anos |

---

### Step 6: `retorno` — Confirmação e Retorno

Exibir resumo da simulação original:
- Crédito solicitado
- Parcelas
- Juros mensais
- Valor da parcela

Mensagem: *"Obrigado pelas informações! Agora é com a gente, sua proposta já está em análise. Fique de olho no WhatsApp e no seu e-mail."*

Ao confirmar: `finalizeEtapa1(proposalId)` → status `proposta_criada`.

---

## Etapa 2 — Documentos e Dados Bancários

Acessada via `/proposta/[proposalId]/documentos`.

### Steps da Etapa 2

```
dados-bancarios → documentos-pessoais → documentos-imovel → finalizado
```

---

### Step 7: `dados-bancarios` — Dados Bancários

| Campo | Tipo | Regra |
|---|---|---|
| Banco | select | Lista de bancos cadastrados no banco de dados |
| Agência | text | Apenas números |
| Conta-corrente | text | Apenas números |
| Chave PIX | text | Opcional |
| Confirmação | checkbox | "Confirmo que esta conta está em meu nome." Obrigatório. Erro se não marcado: "A conta informada não corresponde ao titular do crédito. Utilize uma conta bancária em seu nome." |

---

### Step 8: `documentos-pessoais` — Documentos Pessoais

Documentos obrigatórios (checklist):
- RG e CPF (frente e verso)
- Comprovante de estado civil
- Comprovante de endereço (últimos 3 meses)
- Declaração do IR com recibo de entrega

> Se cônjuge: mesmos documentos para o cônjuge.

Regras de upload: PDF ou JPEG. Pré-visualização após envio. Item marcado como ✓ após upload. Botão "Avançar" habilitado somente após checklist completo.

---

### Step 9: `documentos-imovel` — Documentos do Imóvel

Documentos obrigatórios (checklist):
- Matrícula atualizada
- IPTU com metragens
- CND de Tributos Imobiliários (até 30 dias)
- Comprovante de endereço do imóvel
- Fotos do imóvel — externas e internas (JPEG)

Botão "Finalizar Envio" → `finalizeEtapa2(proposalId)` → redireciona para `/proposta/[proposalId]/finalizado`.

---

### Step 10: `finalizado`

Mensagem: *"Agradecemos pelo envio das informações e documentos! Agora, nossa equipe jurídica e os analistas de crédito darão continuidade à análise para avançarmos para a etapa de contrato. Fique de olho no seu e-mail e WhatsApp, em breve entraremos em contato com os próximos passos. Se tiver qualquer dúvida, nossa equipe está pronta para te atender!"*
