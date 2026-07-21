# Feature Spec — Subscription Plans

**App:** `apps/admin` — Vello Admin
**Module:** Admin / Plans
**Status:** `ready-for-dev`
**Priority:** High — foundation for tenant registration

---

## Context

Plans define the commercial model for each tenant. Billing is not automated —
plans guide manual onboarding and determine the tenant's default commission percentage.

Plan types:
- **SaaS:** recurring monthly fee + % on commissions
- **White-Label:** one-time setup fee + % on commissions (no monthly fee)

---

## Features

### F1 — Listing · `/plans`
- Table: Name · Type · Monthly Fee · Setup Fee · Tenant Commission · Status · Actions
- Filters: Type · Status
- "New Plan" button

**Acceptance:**
- [ ] Monthly Fee shows "—" for White-Label
- [ ] Status badge: green (active) / gray (inactive)
- [ ] Inactive plans appear with reduced opacity

---

### F2 — Create · `/plans/new`

| Field | Type | Required | Validation |
|---|---|---|---|
| Name | Text | Yes | 3–100 chars, unique |
| Type | Select | Yes | `signature` / `white_label` |
| Monthly Fee (R$) | Number | If SaaS | > 0 |
| Setup Fee (R$) | Number | No | >= 0, default 0 |
| Tenant Commission (%) | Number | Yes | 0.0001–100, 4 decimals |
| Max. Products | Number | No | >= 1, empty = unlimited |
| Features | Tags | No | Free text |
| Active | Toggle | — | Default: true |

**Acceptance:**
- [ ] Monthly Fee field disabled when Type = White-Label
- [ ] On save: redirect to listing with success toast
- [ ] Duplicate name: inline error on the field

---

### F3 — Edit · `/plans/[id]/edit`
- Form identical to the create form, pre-filled
- **Type** field is read-only after creation (explanatory tooltip)
- Warning at the top: *"Changes do not affect commissions on proposals already recorded"*

---

### F4 — Deactivate / Reactivate
- Confirmation modal before deactivating
- Inactive plan: does not appear in the select when registering new tenants
- Existing tenants on the plan are not affected

**Acceptance:**
- [ ] Modal displays: *"This plan will not be available for new tenants. Existing tenants are not affected."*

---

### F5 — Details · `/plans/[id]`
- All plan data
- List of tenants using the plan (name, status, activation date)
- Counter of active tenants on the plan

---

## Files to Create

```
apps/admin/src/app/(private)/plans/
├── page.tsx
├── new/page.tsx
├── [id]/
│   ├── page.tsx
│   └── edit/page.tsx
├── actions.ts
├── queries.ts
└── _components/
    ├── plan-table.tsx
    ├── plan-form.tsx
    └── plan-status-badge.tsx

supabase/migrations/
└── 20260401120000_create_plans.sql
```

## Implementation Constraints

- `page.tsx` is a Server Component — fetches data directly from the Supabase server client
- `_components/plans-table.tsx` is a Client Component — receives `plans` via props, with no database access
- `actions.ts` uses `'use server'` — the sole mutation point, never exported to the client
- `queries.ts` is imported only by Server Components and Actions — never by Client Components
