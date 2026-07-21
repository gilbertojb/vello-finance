# Spec — Application: Home Equity Legal Entity (Property-Backed Credit PJ)

**Date:** 2026-05-17
**Flow slug:** `home_equity_pj`
**Route:** `/contratar/home-equity-pj`
**Status:** Approved

---

## Simulation

Existing form at `/simulador/pessoa-juridica/imovel-em-garantia`.

Additional field (aligned with Home Equity PF):

| New field | Type | Rule |
|---|---|---|
| Has this credit already been requested elsewhere? | select (Yes/No) | If Yes: subfields "Where?" and "Amount released" |

CTA: **"I want to apply"** → `/contratar/home-equity-pj?productId={uuid}&simulationId={uuid}`

---

## Step 1 — Data for Analysis

### Steps

```
operacao → dados-empresa → atividade-faturamento → dados-socios → endereco-garantia → endereco-empresa → retorno
```

---

### Step 1: `operacao` — Information about the Transaction

| Field | Type | Rule |
|---|---|---|
| Property type | select | Standalone house, House in a condominium, Apartment, Land, Office, Store, Studio, Flat |
| Property financed? | select (Yes/No) | If Yes: "Amount paid so far" (currency). If > 40% of the property → **block** |
| Title deed number | text | Numbers only |
| Reason for credit | select | Pay off personal debts, Pay off company debts, Invest in own business, Renovation or construction, Purchase of another property, Personal projects, Other |

---

### Step 2: `dados-empresa` — Company Data

> Headline: "No worries — your application is saved automatically after each completed step."

| Field | Type | Rule |
|---|---|---|
| Legal name | text | Letters and numbers |
| CNPJ (company tax ID) | text | Numbers only, automatic validation |
| Company age | select | Less than 3 years → **block**: "A minimum of 3 years in business is required for this credit line.", More than 3 years |

---

### Step 3: `atividade-faturamento` — Business Activity and Revenue

| Field | Type | Rule |
|---|---|---|
| Company activity | text | Free text |
| Annual revenue | currency | Auto-formatted currency (R$) |
| Number of partners | number | When N is entered, display N partner field blocks below (inline in this step or as a sub-section) |

**Fields for each partner (inline):**
- Full name (minimum 2 words)
- CPF (individual tax ID, automatic validation)
- Date of birth (block if ≥ 70 years old)
- Email
- WhatsApp (fixed country code +55)

---

### Step 4: `dados-socios` — Partner Data (detailed)

Marital status for each partner:
| Field | Type | Rule |
|---|---|---|
| Marital status | select (Married/Single/Other) | If Married: same personal data required for spouse |

---

### Step 5: `endereco-garantia` — Collateral (Property) Address

ZIP code, Street, Number, Complement (optional), Neighborhood, City, State.
ZIP code lookup via `/api/cep/[cep]` with auto-fill and editing allowed.

---

### Step 6: `endereco-empresa` — Company Address

Same fields as the previous step. "Same as collateral address" checkbox.

---

### Step 7: `retorno` — Confirmation and Return

Simulation summary + review message. `finalizeEtapa1` → status `proposta_criada`.

---

## Step 2 — Documents and Banking Data

Accessed via `/proposta/[proposalId]/documentos`.

### Steps

```
dados-bancarios → documentos-empresa → documentos-pessoais-socios → documentos-imovel → finalizado
```

---

### Step 8: `dados-bancarios`

Bank (registered list), Branch, Checking account, PIX key (optional), Account ownership confirmation checkbox.

---

### Step 9a: `documentos-empresa` — Company Documents

Checklist:
- CNPJ (company tax ID)
- Updated Articles of Incorporation
- Proof of company address (last 3 months)
- Balance sheet for the last year
- Trial balance for the last 3 months
- Income statement (DRE) for the last year or Simples Nacional tax filing
- Statement of the last 12 months' revenue (signed by the accountant)
- Company (PJ) bank statement (last 3 months)
- Personal (PF) bank statement (last 3 months)
- ID and CPF (front and back) for the partners

---

### Step 9b: `documentos-pessoais-socios` — Partners' Personal Documents

Per partner (and spouse, if applicable):
- ID and CPF (front and back)
- Proof of marital status
- Proof of address (last 3 months)
- Income tax return with filing receipt

---

### Step 10: `documentos-imovel` — Property Documents

Checklist:
- Updated title deed
- Property tax (IPTU) with area measurements
- Property tax clearance certificate (CND) (issued within 30 days)
- Proof of property address
- Photos of the property (exterior and interior – JPEG)
- Lease agreement (if applicable)

"Submit" button → `finalizeEtapa2` → `/proposta/[proposalId]/finalizado`.

---

### Step 11: `finalizado`

Completion message: *"Thank you for submitting your information and documents! Our legal team and credit analysts will now continue the review before moving on to the contract stage."*
