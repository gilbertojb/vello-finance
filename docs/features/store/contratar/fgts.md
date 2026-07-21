# Spec — Application: FGTS (Birthday Withdrawal Anticipation)

**Date:** 2026-05-17
**Flow slug:** `fgts`
**Route:** `/contratar/fgts`
**Status:** Approved

---

## Simulation

FGTS **has no simulation** — when clicking the product on the Individual (Pessoa Física) selection screen, the customer is redirected directly to the application flow:

```
/contratar/fgts?productId={uuid}
```

The simulation form at `/simulador/pessoa-fisica/fgts` can be kept as an optional estimate, but the primary CTA goes straight to the application.

---

## Step 1 — Data for Analysis

### Steps

```
liberacao-saque → liberacao-bancos → verificar-margem → dados-bancarios → retorno
```

---

### Step 1: `liberacao-saque` — Birthday Withdrawal Activation

| Field | Type | Rule |
|---|---|---|
| Have you already activated the Birthday Withdrawal in the FGTS app? | select (Yes/No) | If Yes → enable "Continue". If No → show explainer video + instructions on how to do it. "I already did it" button → enable "Continue" |

> Note: show step-by-step instructions on how to activate the Birthday Withdrawal in the Caixa FGTS app.

---

### Step 2: `liberacao-bancos` — Bank Authorization on FGTS

| Field | Type | Rule |
|---|---|---|
| Have you already authorized banks on your FGTS? | select (Yes/No) | If Yes → enable "Continue". If No → show explainer video + instructions. "I already did it" button → enable "Continue" |

---

### Step 3: `verificar-margem` — Data for Margin Check

> Headline: "Don't worry — your application is automatically saved after each completed step."

| Field | Type | Rule |
|---|---|---|
| Full name | text | Pre-filled if coming from the simulation, editable. Minimum 2 words |
| CPF | text | Required, automatic validation |
| RG | text | Required |
| Date of birth | date | Block if ≥ 70 years old |
| Email | email | Required |
| WhatsApp | tel | Pre-filled if coming from the simulation. Country code +55 |

---

### Step 4: `dados-bancarios` — Bank Details

| Field | Type | Rule |
|---|---|---|
| Bank | select | List of registered banks |
| Branch (Agência) | text | Numbers only |
| Checking account | text | Numbers only |
| PIX key | text | Optional |
| Confirmation | checkbox | "I confirm this account is in my name." Required. |

Error: "The account provided does not match the credit holder. Use a bank account in your own name."

---

### Step 5: `retorno` — Confirmation and Return

Simulation summary (if coming from the simulation):
- Estimated credit
- Installments (informational)
- Interest (informational)

Message: *"We've received your information and have already started the analysis! Keep an eye on WhatsApp and email — you'll hear back from us soon."*

`finalizeEtapa1` → status `proposta_criada`.

---

## Step 2

FGTS has no Step 2 for documents. After approval by the consultant, the customer receives the link directly to finalize.

### Finalization

Page `/proposta/[proposalId]/finalizado`.

Message: *"Thank you for submitting your information and documents! You will soon receive the link to proceed with the credit application. Keep an eye on your email and WhatsApp — we'll reach out there with the next steps!"*
