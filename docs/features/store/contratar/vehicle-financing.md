# Spec — Application: Individual Vehicle Financing

**Date:** 2026-05-17
**Flow slug:** `financiamento_veiculo`
**Route:** `/contratar/financiamento-veiculo`
**Status:** Approved

---

## Simulation

Existing form at `/simulador/financiamentos/veiculo`. No relevant changes.

CTA: **"I want to apply"** → `/contratar/financiamento-veiculo?productId={uuid}&simulationId={uuid}`

---

## Step 1 — Data for Analysis

### Steps

```
operacao → dados-pessoais → renda-ocupacao → dados-vendedor → retorno
```

---

### Step 1: `operacao` — Operation Information

| Field | Type | Rule |
|---|---|---|
| Vehicle type | select | Options to be defined with the finance team (suggestion: Car, Motorcycle, Truck, Van) |
| Vehicle already financed? | select (Yes/No) | If Yes and amount paid > 80% of the vehicle value → **block** |
| License plate | text | Letters and numbers, format validation |

---

### Step 2: `dados-pessoais` — Personal Data

> Headline: "Don't worry — your application is automatically saved after each completed step."

| Field | Type | Rule |
|---|---|---|
| Full name | text | Pre-filled from the simulation, editable. Minimum 2 words |
| CPF | text | Required, automatic validation |
| Date of birth | date | Block if ≥ 70 years old |
| Email | email | Required |
| Mother's name | text | Required. Minimum 2 words |
| WhatsApp | tel | Pre-filled, editable. Country code +55 |

---

### Step 3: `renda-ocupacao` — Income and Occupation

| Field | Type | Rule |
|---|---|---|
| Profession / Occupation type | select | Employee (CLT), Self-employed, Business owner, Retired, Public servant |
| Monthly income | currency | Automatic R$ formatting |
| Time in occupation | select | Less than 1 year, 1 to 3 years, 3 to 5 years, More than 5 years |
| Employer | text | Required if CLT |

---

### Step 4: `dados-vendedor` — Seller Data (Vehicle Owner)

> Headline: "Don't worry — your application is automatically saved after each completed step."

| Field | Type | Rule |
|---|---|---|
| Full name | text | Minimum 2 words |
| CPF | text | Automatic validation |
| Date of birth | date | Block if ≥ 70 years old |
| Email | email | Required |
| WhatsApp | tel | Country code +55 |
| Marital status | select | If Married → spouse's data |

---

### Step 5: `retorno` — Confirmation and Return

Simulation summary. `finalizeEtapa1` → status `proposta_criada`.

Message: *"Thank you for the information! We'll get back to you about your application soon — keep an eye out, we'll send our response via WhatsApp and email."*

---

## Step 2 — Documents and Bank Details

### Steps

```
dados-bancarios → documentos-pessoais → documentos-veiculo → finalizado
```

---

### Step 6: `dados-bancarios`

Bank, branch, checking account, PIX key, ownership confirmation checkbox.

---

### Step 7: `documentos-pessoais` — Personal Documents

Checklist:
- ID (RG) and CPF (front and back)
- Proof of marital status
- Proof of address (last 3 months)

---

### Step 8: `documentos-veiculo` — Vehicle Documents

Checklist:
- Vehicle registration (CRLV)

"Finish Submission" button → `finalizeEtapa2` → `/proposta/[proposalId]/finalizado`.

---

### Step 9: `finalizado`

Message: *"Thank you for the information and documents! Our legal team and credit analysts will review everything to proceed to the contract stage. Keep an eye on your email and WhatsApp."*
