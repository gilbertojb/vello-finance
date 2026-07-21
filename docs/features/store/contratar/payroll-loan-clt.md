# Spec — Application: Payroll Loan CLT

**Date:** 2026-05-17
**Flow slug:** `consignado_privado`
**Route:** `/contratar/consignado-clt`
**Status:** Approved

---

## Simulation

The simulation flow for Payroll Loan CLT is at `/simulador/pessoa-fisica/consignado`. The customer accesses the application via the CTA on the simulation results.

CTA: **"I want to apply"** → `/contratar/consignado-clt?productId={uuid}&simulationId={uuid}`

---

## Step 1 — Qualification and Origination

Payroll Loan CLT has a **strict pre-filter** before collecting data.

### Steps

```
pre-filtro → autorizacao-dataprev → dados-pessoais → dados-profissionais → dados-bancarios → retorno
```

---

### Step 1: `pre-filtro` — Initial Qualification

Goal: eliminate unviable leads immediately.

| Field | Type | Rule |
|---|---|---|
| Do you have a formal employment contract (CLT)? | select (Yes/No) | No → **block** |
| Is your employment active (no notice period in progress)? | select (Yes/No) | No → **block** |
| Time at current employer ≥ 6 months? | select (Yes/No) | No → **block** |
| Are you between 21 and 65 years old? | select (Yes/No) | No → **block** |

**Blocking message:** *"Unfortunately, you don't currently meet the minimum requirements for this type of credit. But there are other options available for you!"* + "See other products" button.

If all Yes → enable "Continue".

---

### Step 2: `autorizacao-dataprev` — Dataprev Authorization

| Field | Type | Rule |
|---|---|---|
| Authorization | checkbox | "I authorize the lookup of my data via Dataprev for payroll loan credit analysis." Required |

---

### Step 3: `dados-pessoais` — Personal Data

> Headline: "Don't worry — your application is automatically saved after each completed step."

| Field | Type | Rule |
|---|---|---|
| Full name | text | Pre-filled from the simulation. Minimum 2 words |
| CPF | text | Automatic validation |
| Date of birth | date | Block if < 21 years or > 65 years |
| Email | email | Required |
| WhatsApp | tel | Pre-filled. Country code +55 |

---

### Step 4: `dados-profissionais` — Employment Data

| Field | Type | Rule |
|---|---|---|
| Current employer | text | Required |
| Time at employer | select | Less than 6 months → block, 6 months to 1 year, 1 to 3 years, 3 to 5 years, More than 5 years |
| Contract type | text | Fixed: "CLT (Formal Employment Contract)" — informational display only |

---

### Step 5: `dados-bancarios` — Bank Details

| Field | Type | Rule |
|---|---|---|
| Bank | select | List of registered banks |
| Branch (Agência) | text | Numbers only |
| Checking account | text | Numbers only |
| PIX key | text | Optional |
| Confirmation | checkbox | "The account must be in my name." Required |

Error: "The account provided does not match the credit holder. Use a bank account in your own name."

---

### Step 6: `retorno` — Confirmation and Return

Simulation summary. `finalizeEtapa1` → status `proposta_criada`.

Message: *"Thank you very much! We've received your information and will start the analysis. Keep an eye on WhatsApp and email — you'll hear back from us soon."*

---

## Step 2

The documentation does not specify a Step 2 for Payroll Loan CLT. Since this is credit based on payroll-deductible margin verifiable via Dataprev, no physical documents are submitted in this flow.

If needed, Step 2 will be specified in a future session.
