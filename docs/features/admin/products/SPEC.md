# Feature Spec — Credit Products

**App:** `apps/admin` — Vello Admin
**Module:** Admin / Products
**Status:** `ready-for-dev`
**Priority:** High
**Depends on:** `financial_partners` registered

---

## F0 — Financial Partners · `/financial-partners`

CRUD with fields: Name · Type (`qi_tech`, `bancly`, `zip`, `other`) · API URL · API Key (masked) · Webhook Secret (masked) · Active

> API Key and Webhook Secret visible only to `super_admin`.

---

## F1 — Listing · `/products`

Table: Name · Type · Financial Partners (list) · Vello Retention (per partner) · Available to Tenant · Status · Actions

Filters: Type · Financial Partner · Status

---

## F2 — Create · `/products/new`

**Section 1 — Identification**

| Field | Required | Validation |
|---|---|---|
| Name | Yes | 3–100 chars |
| Type | Yes | `fgts` / `consignado_publico` / `consignado_privado` / `home_equity` / `auto_equity` / `outros` |
| Public Description | No | Max 500 chars (rich text) |
| Internal Description | No | Rich text |

**Section 2 — Credit Parameters**

Minimum/Maximum Amount (R$) · Minimum/Maximum Term (months) · Minimum/Maximum Monthly Rate (%)

**Section 3 — Financial Partners**

List of checkboxes with all active financial partners. For each partner checked, two inline fields:

| Field | Required | Validation |
|---|---|---|
| Financial partner pays Vello (%) | Yes (if partner checked) | 0.001–100, up to 3 decimal places |
| Vello Retention (%) | Yes (if partner checked) | ≤ Financial partner pays Vello, up to 3 decimal places |

> The commission available to the tenant = Financial partner pays Vello − Vello Retention, and varies per partner.

**Acceptance:**
- [ ] Commission fields appear only for checked financial partners
- [ ] Error if Vello Retention > Financial partner pays Vello for any selected partner
- [ ] Product can be saved with no financial partner linked

---

## F3 — Edit · `/products/[id]/edit`
- All fields editable, except Type (read-only)
- Financial partners can be added or removed; commissions can be edited per partner
- Warning: *"Changes to percentages do not affect proposals already created (immutable snapshots)"*

---

## F4 — Deactivate / Reactivate
- Modal shows how many tenants have the product active
- Deactivating does not automatically remove it from existing tenants

---

## F5 — Details · `/products/[id]`
- Complete data
- Table of linked financial partners with their respective commission percentages
- List of tenants with the product enabled (and each one's individual commissions)

---

## Shared Component: `<CommissionCascade />`

Used on the **product details** page (per financial partner) and in the tenant's product manager. No longer shown on the create/edit form.

```tsx
// apps/admin/src/components/commissions/commission-cascade.tsx
type Props = {
  ifPct: number            // renomeado de bankPct
  velloPct: number
  tenantPct?: number       // opcional — exibido na camada do tenant
  velloSpreadPct?: number  // opcional
}
```

---

## Files to Create / Modify

```
apps/admin/src/app/(private)/
├── financial-partners/
│   ├── page.tsx
│   ├── new/page.tsx
│   ├── [id]/edit/page.tsx
│   ├── actions.ts
│   └── queries.ts
└── products/
    ├── page.tsx
    ├── new/page.tsx
    ├── [id]/
    │   ├── page.tsx
    │   └── edit/page.tsx
    ├── actions.ts
    ├── queries.ts
    └── _components/
        ├── product-table.tsx
        ├── product-form.tsx
        ├── product-type-badge.tsx
        └── commission-cascade.tsx

supabase/migrations/
├── YYYYMMDDHHMMSS_create_product_financial_partners.sql
└── YYYYMMDDHHMMSS_alter_products_remove_commission_columns.sql
```

## Implementation Constraints

- `page.tsx` is a Server Component — fetches data directly from the Supabase server client
- `_components/product-table.tsx` is a Client Component — receives `products` via props, with no database access
- `actions.ts` uses `'use server'` — the sole mutation point, never exported to the client
- `queries.ts` is imported only by Server Components and Actions — never by Client Components
