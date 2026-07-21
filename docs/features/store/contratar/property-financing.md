# Spec — Application: Property Financing

**Date:** 2026-05-17
**Flow slug:** `financiamento_imovel`
**Route:** `/contratar/financiamento-imovel`
**Status:** Approved

---

## Simulation

Existing form at `/simulador/financiamentos/imovel`.

**Document refinements:**
- Available installment terms: 80, 180, 220, 230, 240 months (update select)

CTA: **"I want to apply"** → `/contratar/financiamento-imovel?productId={uuid}&simulationId={uuid}`

---

## Step 1 — Data for Analysis

> Note: the document describes this flow for a Legal Entity, but the same pattern applies to an Individual — company fields are conditional on the applicant type.

### Steps

```
operacao → dados-solicitante → atividade-faturamento → dados-socios → dados-vendedor → endereco-imovel → retorno
```

---

### Step 1: `operacao` — Information about the Transaction

| Field | Type | Rule |
|---|---|---|
| Property type | select | Standalone house, House in a condominium, Apartment, Land, Office, Store, Studio, Flat |
| Property financed? | select (Yes/No) | If Yes: "Amount paid so far" (currency). If > 40% of the value → **block** |
| Title deed number | text | Numbers only |

---

### Step 2: `dados-solicitante` — Applicant / Company Data

> Headline: "No worries — your application is saved automatically after each completed step."

**For Legal Entity:**
| Field | Type | Rule |
|---|---|---|
| Legal name | text | Letters and numbers |
| CNPJ (company tax ID) | text | Numbers only |
| Company age | select | Less than 3 years → **block**, More than 3 years |

---

### Step 3: `atividade-faturamento` — Business Activity and Revenue

| Field | Type | Rule |
|---|---|---|
| Company activity | text | Free text |
| Annual revenue | currency | Auto-formatted currency (R$) |
| Products or services offered | text | Free text |

---

### Step 4: `dados-socios` — Partner Data

Per partner:
- Full name
- CPF (individual tax ID, validation)
- Date of birth (block if ≥ 70 years old)
- Email
- WhatsApp
- Marital status: if Married → spouse data

---

### Step 5: `dados-vendedor` — Seller Data (Property Owner)

| Field | Type | Rule |
|---|---|---|
| Full name | text | Minimum 2 words |
| CPF | text | Automatic validation |
| Date of birth | date | Block if ≥ 70 years old |
| Email | email | Required |
| WhatsApp | tel | Country code +55 |
| Marital status | select | If Married → seller's spouse data |

---

### Step 6: `endereco-imovel` — Property Address

ZIP code (automatic lookup), Street, Number, Complement (optional), Neighborhood, City, State.

---

### Step 7: `retorno` — Confirmation and Return

Simulation summary. `finalizeEtapa1` → status `proposta_criada`.

Message: *"Thank you for the information! We'll have a response on your application soon — keep an eye out, we'll send our reply via WhatsApp and email."*

---

## Step 2 — Documents

### Steps

```
dados-bancarios-vendedor → documentos-empresa → documentos-imovel → finalizado
```

---

### Step 8: `dados-bancarios-vendedor` — Seller's Banking Data

Bank, Branch, Checking account, PIX key, Checkbox confirming account ownership in the seller's name.

---

### Step 9: `documentos-empresa` — Company Documents

Checklist:
- CNPJ (company tax ID)
- Updated Articles of Incorporation
- Proof of company address
- Balance sheet for the last year
- Trial balance for the last 3 months
- Income statement (DRE) for the last year or Simples Nacional tax filing
- Statement of the last 12 months' revenue (signed by the accountant)
- Company (PJ) bank statement (last 3 months)
- ID and CPF (front and back) for the partners

---

### Step 10: `documentos-imovel` — Property Documents

Checklist:
- Updated title deed
- Property tax (IPTU) with area measurements
- Property tax clearance certificate (CND) (issued within 30 days)
- Proof of property address
- Photos of the property — exterior and interior (JPEG)
- Lease agreement (if applicable)

"Submit" button → `finalizeEtapa2` → `/proposta/[proposalId]/finalizado`.

---

### Step 11: `finalizado`

Message: *"Thank you for the information and documents! Our legal team and credit analysts will review everything before moving on to the contract. Keep an eye on your email and WhatsApp."*
