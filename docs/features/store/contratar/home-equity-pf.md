# Spec — Application: Home Equity Individual (Property-Backed Credit)

**Date:** 2026-05-17
**Flow slug:** `home_equity`
**Route:** `/contratar/home-equity`
**Status:** Approved

---

## Simulation (refinements)

The existing simulation form at `/simulador/pessoa-fisica/imovel-em-garantia` receives the following additional fields from the document:

| New field | Type | Rule |
|---|---|---|
| Has this credit already been requested elsewhere? | select (Yes/No) | If Yes: display subfields "Where?" (free text) and "Amount released" (currency) |

CTA in the result: **"I want to apply"** → `/contratar/home-equity?productId={uuid}&simulationId={uuid}`

---

## Step 1 — Data for Analysis

### Step 1 flow

```
operacao → dados-pessoais → endereco-garantia → endereco-residencial → renda-ocupacao → retorno
```

---

### Step 1: `operacao` — Information about the Transaction

| Field | Type | Business rule |
|---|---|---|
| Property type | select | Standalone house, House in a condominium, Apartment, Land, Office, Store, Studio, Flat |
| Property financed? | select (Yes/No) | If Yes: display field "Amount paid so far" (currency). If amount paid > 40% of the property value → **block**: "At this time, we can't proceed. The property has financing exceeding 40% of its value." |
| Title deed number | text | Accept numbers only |
| Reason for credit | select | Pay off personal debts, Pay off company debts, Invest in own business, Renovation or construction, Purchase of another property, Personal projects, Other |

When proceeding: `createProposal` with `product_type_slug = 'home_equity'`, returns `proposalId`.

---

### Step 2: `dados-pessoais` — Personal Data

> Headline: "No worries — your application is saved automatically after each completed step."

| Field | Type | Business rule |
|---|---|---|
| Full name | text | Pre-filled from the simulation, editable. Minimum 2 words |
| CPF | text | Required, automatic validation (algorithm) |
| Date of birth | date | Required. Calculate age: block if ≥ 70 years old with the message "This transaction is not available for people aged 70 or older." |
| Email | email | Required |
| WhatsApp | tel | Pre-filled from the simulation, editable. Fixed country code +55 |
| Marital status | select (Married/Single/Other) | If Married: display "Spouse data" section with the same fields: Name, CPF, Date of birth, Email, WhatsApp |

---

### Step 3: `endereco-garantia` — Collateral (Property) Address

| Field | Type | Rule |
|---|---|---|
| ZIP code | text | Required. After typing 8 digits: query `/api/cep/[cep]` and auto-fill. Show loading state. |
| Street | text | Auto-filled from ZIP code, editable |
| Number | text | Required |
| Complement | text | Optional |
| Neighborhood | text | Auto-filled, editable |
| City | text | Auto-filled, editable |
| State | text | Auto-filled, editable |

---

### Step 4: `endereco-residencial` — Home Address

Same fields as the previous step. Display a "Same as collateral address" checkbox to auto-copy.

---

### Step 5: `renda-ocupacao` — Income and Occupation

| Field | Type | Rule |
|---|---|---|
| Occupation type | select | CLT (formal employee), Self-employed, Business owner, Retired, Public servant |
| Profession | text | Display only if type = CLT |
| Monthly income | currency | Auto-formatted currency (R$), numbers only |
| Time in occupation | select | Less than 1 year, 1 to 3 years, 3 to 5 years, More than 5 years |

---

### Step 6: `retorno` — Confirmation and Return

Display the original simulation summary:
- Requested credit amount
- Installments
- Monthly interest
- Installment amount

Message: *"Thank you for the information! It's now in our hands — your application is already under review. Keep an eye on WhatsApp and your email."*

On confirmation: `finalizeEtapa1(proposalId)` → status `proposta_criada`.

---

## Step 2 — Documents and Banking Data

Accessed via `/proposta/[proposalId]/documentos`.

### Step 2 flow

```
dados-bancarios → documentos-pessoais → documentos-imovel → finalizado
```

---

### Step 7: `dados-bancarios` — Banking Data

| Field | Type | Rule |
|---|---|---|
| Bank | select | List of banks registered in the database |
| Branch | text | Numbers only |
| Checking account | text | Numbers only |
| PIX key | text | Optional |
| Confirmation | checkbox | "I confirm that this account is in my name." Required. Error if not checked: "The account provided does not match the credit holder. Please use a bank account in your own name." |

---

### Step 8: `documentos-pessoais` — Personal Documents

Required documents (checklist):
- ID and CPF (front and back)
- Proof of marital status
- Proof of address (last 3 months)
- Income tax return with filing receipt

> If married: same documents required for the spouse.

Upload rules: PDF or JPEG. Preview after upload. Item marked with a checkmark after upload. "Next" button enabled only once the checklist is complete.

---

### Step 9: `documentos-imovel` — Property Documents

Required documents (checklist):
- Updated title deed
- Property tax (IPTU) with area measurements
- Property tax clearance certificate (CND) (issued within 30 days)
- Proof of property address
- Photos of the property — exterior and interior (JPEG)

"Submit" button → `finalizeEtapa2(proposalId)` → redirects to `/proposta/[proposalId]/finalizado`.

---

### Step 10: `finalizado`

Message: *"Thank you for submitting your information and documents! Our legal team and credit analysts will now continue the review before moving on to the contract stage. Keep an eye on your email and WhatsApp — we'll be in touch soon with next steps. If you have any questions, our team is ready to help!"*
