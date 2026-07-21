# Spec — Application: Working Capital Legal Entity

**Date:** 2026-05-17
**Flow slug:** `capital_giro`
**Route:** `/contratar/capital-de-giro`
**Status:** Approved

---

## Simulation

Existing form at `/simulador/pessoa-juridica/capital-de-giro`. No changes.

CTA: **"I want to apply"** → `/contratar/capital-de-giro?productId={uuid}&simulationId={uuid}`

---

## Step 1 — Data for Analysis

### Steps

```
operacao → dados-empresa → dados-socios → garantia → retorno
```

---

### Step 1: `operacao` — Information about the Transaction

| Field | Type | Rule |
|---|---|---|
| Company type | select | LTDA, EPP, S.A., Other. **MEI (micro-entrepreneur) is not accepted** — if selected: **block**: "This credit line is not available for MEI (micro-entrepreneurs)." |
| Founding date (CNPJ registration date) | date | If company < 3 years → **block**: "The company must be at least 3 years old for this credit line." |
| Revenue for the last 12 months | currency | Minimum R$ 250,000.00. If < R$ 250K → **block**: "The minimum revenue required for this credit line is R$ 250K." |
| Reason for credit | select | Pay off personal debts, Pay off company debts, Invest in own business, Renovation or construction, Purchase of another property, Personal projects, Other |

---

### Step 2: `dados-empresa` — Company Data

> Headline: "No worries — your application is saved automatically after each completed step."

| Field | Type | Rule |
|---|---|---|
| Legal name | text | Letters and numbers |
| CNPJ (company tax ID) | text | Numbers only, automatic validation |
| Company activity | text | Free text |
| Products or services offered | text | Free text |
| Annual revenue | currency | Auto-formatted currency (R$) |

---

### Step 3: `dados-socios` — Partner Data

| Field | Type | Rule |
|---|---|---|
| Number of partners | number | Display N field blocks |

Per partner:
- Full name (minimum 2 words)
- CPF (individual tax ID, automatic validation)
- Date of birth (block if ≥ 70 years old)
- Email
- WhatsApp (country code +55, active validation)
- Marital status: if Married → same personal data required for spouse

---

### Step 4: `garantia` — Collateral for the Transaction

| Field | Type | Rule |
|---|---|---|
| Does your company have any real or pledged collateral? | select (Yes/No) | If Yes → display field: "What type of collateral do you have?" |
| Collateral type | select | Trade receivables (duplicatas), Credit cards, Financial investments, Simple domicile, Commercial property, Receivables |

> Flow note: if collateral is "Commercial property", property documents will be requested in Step 2. If "Receivables", follow the receivables anticipation document standard.

---

### Step 5: `retorno` — Confirmation and Return

Simulation summary + review message.

Message: *"Thank you for the information! It's now in our hands — your application is already under review. Keep an eye on WhatsApp and your email."*

`finalizeEtapa1` → status `proposta_criada`.

---

## Step 2 — Documents and Banking Data

### Steps

```
dados-bancarios → documentos-empresa → documentos-pessoais-socios → documentos-garantia (se houver) → finalizado
```

---

### Step 6: `dados-bancarios`

Bank, Branch, Checking account, PIX key, Account ownership checkbox.

---

### Step 7: `documentos-empresa`

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

### Step 8: `documentos-pessoais-socios`

Per partner (and spouse, if applicable):
- ID and CPF (front and back)
- Proof of marital status
- Proof of address (last 3 months)
- Income tax return with filing receipt

---

### Step 9: `documentos-garantia` (conditional)

Shown only if the customer indicated they have collateral. Documents vary according to the selected type:

- **Property:** Title deed, property tax (IPTU), tax clearance certificate (CND), proof of address, photos
- **Receivables:** Receivables statement, contracts, invoices
- **Other:** Supporting document for the asset

---

### Step 10: `finalizado`

Message: *"Thank you for submitting your information and documents! Our legal team and credit analysts will now continue the review. Keep an eye on your email and WhatsApp."*
