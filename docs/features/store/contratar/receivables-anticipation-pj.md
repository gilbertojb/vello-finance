# Spec — Application: Receivables Anticipation, Business (PJ)

**Date:** 2026-05-17
**Flow slug:** `antecipacao_recebiveis`
**Route:** `/contratar/antecipacao-recebiveis`
**Status:** Approved

---

## Simulation

Existing form at `/simulador/pessoa-juridica/antecipacao-recebiveis`. No changes.

CTA: **"I want to apply"** → `/contratar/antecipacao-recebiveis?productId={uuid}&simulationId={uuid}`

---

## Step 1 — Data for Analysis

### Steps

```
operacao → dados-empresa → dados-socios → retorno
```

---

### Step 1: `operacao` — Operation Information

| Field | Type | Rule |
|---|---|---|
| Receivable type | select | Card machine (Credit Card), Trade note (Duplicata), Electronic Invoice (NF-e), Contract Receivable |
| Founding date (CNPJ registration date) | date | If company < 3 years old → **block**: "The company must be at least 3 years old to qualify for this credit line." |
| Revenue over the last 12 months | currency | Minimum R$ 120,000.00. If < R$ 120k → **block**: "The minimum revenue required for this credit line is R$ 120k." |
| Reason for credit | select | Pay off personal debts, Pay off business debts, Invest in own business, Renovation or construction, Purchase of another property, Personal projects, Other |

---

### Step 2: `dados-empresa` — Company Data

> Headline: "Don't worry — your application is automatically saved after each completed step."

| Field | Type | Rule |
|---|---|---|
| Legal name | text | Letters and numbers |
| CNPJ | text | Numbers only, automatic validation |
| Company activity | text | Free text |
| Products or services offered | text | Free text |
| Annual revenue | currency | Automatic R$ formatting |

---

### Step 3: `dados-socios` — Partners' Data

Per partner (quantity provided in the previous step or field here):
- Full name (minimum 2 words, pre-filled from the simulation if available)
- CPF (automatic validation)
- RG (required)
- Date of birth (block if ≥ 70 years old)
- Email
- WhatsApp (country code +55)

---

### Step 4: `retorno` — Confirmation and Return

Simulation summary + message.

Message: *"Thank you for the information! It's on us now — your application is already under review. Keep an eye on WhatsApp and email."*

`finalizeEtapa1` → status `proposta_criada`.

---

## Step 2 — Documents and Bank Details

### Steps

```
dados-bancarios → documentos-empresa → documentos-pessoais-socios → documentos-garantia → finalizado
```

---

### Step 5: `dados-bancarios`

Bank, branch, checking account, PIX key, ownership confirmation checkbox.

---

### Step 6: `documentos-empresa`

Checklist:
- CNPJ
- Updated Articles of Incorporation (Contrato Social)
- Proof of company address (last 3 months)
- Balance Sheet from the last year
- Trial balance from the last 3 months
- Income statement (DRE) from the last year, or Simples Nacional filing
- Statement of the last 12 months of revenue (signed by the accountant)
- Business bank statement (last 3 months)
- Personal bank statement (last 3 months)
- ID (RG) and CPF (front and back) of the partners

---

### Step 7: `documentos-pessoais-socios`

Per partner (and spouse, if applicable):
- ID (RG) and CPF (front and back)
- Proof of marital status
- Proof of address (last 3 months)
- Income tax return with filing receipt

---

### Step 8: `documentos-garantia` — Receivables Documents

Checklist varies according to the receivable type selected in Step 1:

| Type | Documents |
|---|---|
| Card machine | Sales statement (last 3 months), agreement with payment processor |
| Trade note (Duplicata) | Receivable trade notes with due dates |
| NF-e | Electronic Invoices with XML |
| Contract | Contracts with payment schedule |

---

### Step 9: `finalizado`

Message: *"Thank you for submitting your information and documents! Our legal team and credit analysts will now continue the review so we can move forward to the contract stage."*
