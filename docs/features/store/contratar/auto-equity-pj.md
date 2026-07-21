# Spec — Application: Auto Equity Legal Entity (Vehicle-Backed Credit PJ)

**Date:** 2026-05-17
**Flow slug:** `auto_equity_pj`
**Route:** `/contratar/auto-equity-pj`
**Status:** Approved

---

## Simulation

Existing form at `/simulador/pessoa-juridica/veiculo-em-garantia`. No changes.

CTA: **"I want to apply"** → `/contratar/auto-equity-pj?productId={uuid}&simulationId={uuid}`

---

## Step 1 — Data for Analysis

### Steps

```
operacao → dados-empresa → atividade-faturamento → dados-socios → retorno
```

---

### Step 1: `operacao` — Information about the Transaction

| Field | Type | Rule |
|---|---|---|
| Vehicle type | select | Car, Truck, Motorcycle |
| Vehicle financed? | select (Yes/No) | If Yes → **block**: "At this time, we can't proceed with this transaction because the vehicle provided still has an active financing agreement." |
| Vehicle license plate | text | License plate format validation |
| Manufacturing year | select | Block if > 15 years: "This vehicle does not meet the minimum manufacturing year requirements." |
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
| Monthly revenue | currency | Auto-formatted currency (R$) |

---

### Step 4: `dados-socios` — Partner Data

| Field | Type | Rule |
|---|---|---|
| Number of partners | number | Display N field blocks |

Per partner:
- Full name (minimum 2 words)
- CPF (individual tax ID, automatic validation)
- Date of birth (block if ≥ 70 years old)
- Email
- WhatsApp (country code +55)
- Marital status: if Married → same personal data required for spouse

---

### Step 5: `retorno` — Confirmation and Return

Simulation summary. Message: *"All set! We've received your information and have already started reviewing your application."*

`finalizeEtapa1` → status `proposta_criada`.

---

## Step 2 — Documents and Banking Data

### Steps

```
dados-bancarios → documentos-empresa → documentos-pessoais-socios → documentos-veiculo → finalizado
```

---

### Step 6: `dados-bancarios`

Bank, Branch, Checking account, PIX key, Account ownership checkbox.

---

### Step 7: `documentos-empresa`

Checklist:
- CNPJ (company tax ID)
- Updated Articles of Incorporation
- Proof of company address
- Balance sheet for the last year
- Trial balance for the last 3 months
- Income statement (DRE) for the last year or Simples Nacional tax filing
- Statement of the last 12 months' revenue (signed by the accountant)
- Company (PJ) bank statement (last 3 months)
- Photos of the company (facade and interior, JPEG)
- ID and CPF (front and back) for the partners

---

### Step 8: `documentos-pessoais-socios` — Partners' Personal Documents

Per partner (and spouse, if applicable):
- ID and CPF (front and back)
- Proof of marital status
- Proof of address (last 3 months)
- Income tax return with filing receipt

---

### Step 9: `documentos-veiculo` — Vehicle Documents

Checklist:
- Vehicle registration certificate (CRLV)
- Rear photo (JPEG)
- Rear license plate photo (JPEG)
- Chassis photo (JPEG)

"Submit" button → `finalizeEtapa2` → `/proposta/[proposalId]/finalizado`.

---

### Step 10: `finalizado`

Message: *"Thank you, we've received your documents! Our legal team and credit analysts are now reviewing everything before moving on to the contract stage."*
