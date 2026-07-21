# Spec — Application: Auto Equity Individual (Credit Secured by Vehicle, PF)

**Date:** 2026-05-17
**Flow slug:** `auto_equity`
**Route:** `/contratar/auto-equity`
**Status:** Approved

---

## Simulation

Existing form at `/simulador/pessoa-fisica/veiculo-em-garantia`. No field changes.

CTA: **"I want to apply"** → `/contratar/auto-equity?productId={uuid}&simulationId={uuid}`

---

## Step 1 — Data for Analysis

### Steps

```
operacao → dados-pessoais → renda-ocupacao → retorno
```

---

### Step 1: `operacao` — Operation Information

| Field | Type | Rule |
|---|---|---|
| Vehicle type | select | Car, Truck, Motorcycle |
| Vehicle financed? | select (Yes/No) | If Yes → **block**: "At the moment, we can't proceed with this operation because the vehicle provided still has an active financing agreement. To move forward, it needs to be fully paid off." |
| License plate | text | Letters and numbers, plate format validation (AAA-0000 or AAA-0A00) |
| Manufacture year | select | Select year. Block if the vehicle is more than 15 years old: "This vehicle does not meet the minimum manufacture year requirements." |
| Reason for credit | select | Pay off personal debts, Pay off business debts, Invest in own business, Renovation or construction, Purchase of another property, Personal projects, Other |

---

### Step 2: `dados-pessoais` — Personal Data

> Headline: "Don't worry — your application is automatically saved after each completed step."

| Field | Type | Rule |
|---|---|---|
| Full name | text | Pre-filled from the simulation, editable. Minimum 2 words |
| CPF | text | Required, automatic validation |
| Date of birth | date | Block if ≥ 70 years old |
| Email | email | Required |
| WhatsApp | tel | Pre-filled, editable. Fixed country code +55 |
| Mother's name | text | Required. Minimum 2 words |

---

### Step 3: `renda-ocupacao` — Income and Occupation

| Field | Type | Rule |
|---|---|---|
| Occupation type | select | Employee (CLT), Self-employed, Business owner, Retired, Public servant |
| Monthly income | currency | Automatic R$ formatting |
| Time in occupation | select | Less than 1 year, 1 to 3 years, 3 to 5 years, More than 5 years |

---

### Step 4: `retorno` — Confirmation and Return

Simulation summary:
- Requested credit
- Installment plan
- Monthly interest
- Installment amount

Message: *"All set! We've received your information and have already started analyzing your application. You'll hear back from us soon directly on WhatsApp and email — just keep an eye out!"*

`finalizeEtapa1` → status `proposta_criada`.

---

## Step 2 — Documents and Bank Details

Accessed via `/proposta/[proposalId]/documentos`.

### Steps

```
dados-bancarios → documentos-pessoais → documentos-veiculo → finalizado
```

---

### Step 5: `dados-bancarios`

Bank (registered list), branch, checking account, PIX key (optional), account ownership confirmation checkbox.

Error: "The account provided does not match the credit holder. Use a bank account in your own name."

---

### Step 6: `documentos-pessoais` — Personal Documents

Checklist:
- ID (RG) and CPF (front and back)
- Driver's license / CNH (front and back)
- Proof of marital status
- Proof of address (last 3 months)

---

### Step 7: `documentos-veiculo` — Vehicle Documents

Checklist:
- Vehicle registration (CRLV)
- Rear photo of the vehicle (JPEG)
- Photo of the rear license plate (JPEG)
- Photo of the chassis (JPEG)

"Finish Submission" button → `finalizeEtapa2` → `/proposta/[proposalId]/finalizado`.

---

### Step 8: `finalizado`

Message: *"We've received your documents, thank you for sharing them with us! Our legal team and credit analysts are now handling the review so we can move on to the next step: contract formalization. Keep an eye on your email and WhatsApp — we'll be in touch soon with the next steps."*
