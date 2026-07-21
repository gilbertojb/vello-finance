# Feature Spec — Tenant Management

**App:** `apps/admin` — Vello Admin
**Module:** Admin / Tenants
**UI Terminology:** "Parceiros" (database keeps `tenants`)
**Status:** `in-progress`
**Priority:** High

## Implementation Status

| Feature | Status | Notes |
|---|---|---|
| F1 — Listing | ✅ Implemented | — |
| F2 — Registration | ✅ Implemented | Form in cards; no plan_id; type fixed to whitelabel; no file upload |
| F3 — Activate | ⏳ Pending | — |
| F4 — Edit | ⏳ Pending | — |
| F5 — Products | ⏳ Pending | — |
| F6 — Suspend/Cancel | ⏳ Pending | — |
| F7 — Details | ⏳ Pending | — |

## Technical Decisions

- `type` fixed to `whitelabel` on registration — no form field for now
- `plan_id` made nullable via migration — plan association deferred to the subscriptions module
- Registration form in **cards** (not a 5-step wizard as originally planned)
- Logo/favicon/image upload to Supabase Storage deferred — text URL fields for now
- `custom_domain` always visible on the form (all are white-label)

---

## Tenant Types

| | White-Label | Subscription (SaaS) |
|---|---|---|
| Business model | One-time payment (setup) + % commissions | Recurring monthly fee + % commissions |
| Visual identity | Fully customized | Standard Vello identity |
| URL | Own domain (`creditos.empresa.com.br`) | Vello subdomain (`slug.vellofinance.com.br`) |
| Public screens | Custom logo, colors, and background image | Standard Vello layout |
| Onboarding | Assisted by the internal team | Manual |
| Console customization | Full | Limited (optional logo) |

---

## Data Model

### `tenants` table

```sql
CREATE TYPE tenant_type AS ENUM ('whitelabel', 'subscription');
CREATE TYPE tenant_status AS ENUM ('pending', 'active', 'suspended', 'cancelled');

CREATE TABLE tenants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id           UUID NOT NULL REFERENCES plans(id),
  type              tenant_type NOT NULL,
  name              TEXT NOT NULL,
  company_name      TEXT NOT NULL,
  cnpj              TEXT NOT NULL UNIQUE,
  email             TEXT NOT NULL,
  phone             TEXT,
  slug              TEXT NOT NULL UNIQUE,
  custom_domain     TEXT UNIQUE,             -- white-label only
  status            tenant_status NOT NULL DEFAULT 'pending',
  activated_at      TIMESTAMPTZ,
  suspended_at      TIMESTAMPTZ,
  bank_name         TEXT,
  bank_agency       TEXT,
  bank_account      TEXT,
  bank_pix_key      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `tenant_branding` table

Stores the visual identity used on the public Console and Store screens.

```sql
CREATE TABLE tenant_branding (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url              TEXT,
  favicon_url           TEXT,
  primary_color         TEXT NOT NULL DEFAULT '#3B5BBE',
  secondary_color       TEXT NOT NULL DEFAULT '#1E3A5F',
  -- Public screens (sign-in, forgot-password, reset-password)
  auth_bg_image_url     TEXT,              -- right panel image
  auth_bg_color         TEXT NOT NULL DEFAULT '#18181b',   -- left panel background
  auth_theme            TEXT NOT NULL DEFAULT 'dark'
                        CHECK (auth_theme IN ('dark', 'light')),
  company_display_name  TEXT,             -- name shown on the screens
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Automatically creates default branding when a tenant is created
CREATE OR REPLACE FUNCTION create_default_branding()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tenant_branding (tenant_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_default_branding
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION create_default_branding();

CREATE TRIGGER trg_set_updated_at_tenants
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_tenant_branding
  BEFORE UPDATE ON tenant_branding
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## Features

### F1 — Listing · `src/app/(private)/tenants/page.tsx`

**Summary cards:** Active Tenants · White-Labels · Subscriptions · Pending Activation

**Table columns:** Name · CNPJ · Type · Plan · Status · Domain · Created At · Actions

**Filters:** Type (All / White-Label / Subscription) · Status · Search by name, CNPJ, slug

**Acceptance Criteria:**
- [ ] Type badge: `WL` (navy) for white-label, `SaaS` (blue) for subscription
- [ ] Status badge with semantic colors (see `docs/ui/design-system.md`)
- [ ] Clicking the row → tenant details

---

### F2 — Create Tenant · `src/app/(private)/tenants/new/page.tsx`

Form with **5 steps** and a visual stepper at the top:

#### Step 1 — Type and Plan

| Field | Type | Required |
|---|---|---|
| Type | Radio cards | Yes |
| Plan | Select | Yes |

Radio cards with a description of each type:
- **White-Label** — "Own visual identity, custom domain, one-time setup"
- **Subscription** — "Vello identity, standard subdomain, recurring monthly fee"

When a plan is selected: informational card with the default commission and included features.

#### Step 2 — Company Data

| Field | Required | Validation |
|---|---|---|
| Trade Name | Yes | 2–100 chars |
| Legal Name | Yes | 2–150 chars |
| CNPJ | Yes | Check digits |
| Contact Email | Yes | Valid format |
| Phone | No | — |

#### Step 3 — Store Configuration

| Field | Required | Detail |
|---|---|---|
| Slug | Yes | Auto-generated from the trade name. Real-time preview: `[slug].vellofinance.com.br` |
| Custom Domain | Only if White-Label | E.g.: `creditos.empresa.com.br` |

**Criteria:**
- [ ] Slug: lowercase, no accents, hyphens instead of spaces
- [ ] Unique slug verification via debounce (database query)
- [ ] Domain field visible only for White-Label
- [ ] DNS instructions for custom domain shown after saving

#### Step 4 — Visual Identity (Branding)

**Common fields (both types):**

| Field | Required | Detail |
|---|---|---|
| Logo | No | PNG, SVG, WebP. Max 2MB |
| Primary Color | Yes | Color picker + hex. Default: `#3B5BBE` |
| Secondary Color | Yes | Color picker + hex. Default: `#1E3A5F` |

**Extra fields (White-Label only):**

| Field | Required | Detail |
|---|---|---|
| Favicon | No | PNG, ICO. Max 512KB |
| Public screens theme | Yes | Dark / Light. Default: Dark |
| Login panel background color | Yes | Color picker. Dark default: `#18181b` |
| Background image (right panel) | No | JPG/PNG/WebP. Max 5MB. Recommended ratio: 3:2 |
| Display name | No | Name shown on the public screens |

**Real-time preview** of the Console sign-in screen (`<TenantBrandingPreview />` component):

```
┌──────────────────────────────────────────┐
│ Preview — Sign-In Screen                  │
├─────────────────┬────────────────────────┤
│  [auth_bg_color]│                        │
│                 │  [auth_bg_image]       │
│  [logo]         │                        │
│                 │  (fallback: gradient   │
│  Access your    │   primary→secondary)   │
│  account        │                        │
│                 │                        │
│  [email input]  │                        │
│  [pass input]   │                        │
│  [btn primary]  │                        │
└─────────────────┴────────────────────────┘
```

**Criteria:**
- [ ] Upload saved at `tenant-assets/[tenant_id]/logo` in Supabase Storage
- [ ] Preview updates in real time when any branding field changes
- [ ] Color picker with validated hex input
- [ ] White-Label fields hidden for Subscription

#### Step 5 — Bank Details (optional)

Bank · Branch · Account · Pix Key — all optional, can be filled in later.

**On completion:**
- [ ] Tenant created with `status = 'pending'`
- [ ] `tenant_branding` created via trigger with the step 4 values
- [ ] Redirect to details with an action banner: *"Tenant created. Add products and activate."*

---

### F3 — Activate Tenant

**Trigger:** Button on the details page when `status = 'pending'`

**Validations before activation:**
- At least 1 enabled product → **blocks** with a message
- Logo uploaded → warning (does not block)
- Bank details filled in → warning (does not block)

**Prerequisite:** the `tenant_users` table must exist before implementing this action. The `20260409000000_create_tenant_users.sql` migration is created alongside `apps/console` (see `docs/superpowers/specs/2026-04-09-console-app-design.md`).

**Activation flow (Server Action with `createServiceClient()` from `@/lib/supabase/service`):**

```typescript
// 1. Create user in Supabase Auth
const supabase = createServiceClient()
const { data: authUser } = await supabase.auth.admin.createUser({
  email: tenant.email,
  email_confirm: true,
})

// 2. Insert into tenant_users (table created in the console migration)
await supabase.from('tenant_users').insert({
  id: authUser.user.id,
  tenant_id: tenant.id,
  role: 'tenant_admin',
})

// 3. Send magic link for the tenant to set a password
await supabase.auth.admin.generateLink({
  type: 'magiclink',
  email: tenant.email,
})

// 4. Update status
await supabase.from('tenants').update({
  status: 'active',
  activated_at: new Date().toISOString(),
}).eq('id', tenant.id)

// 5. Trigger TenantWelcomeEmail via Resend (packages/transactional)
```

**Acceptance Criteria:**
- [ ] Confirmation modal before activating
- [ ] If white-label: show DNS instructions after activation
- [ ] Store link shown on the details page after activation
- [ ] Welcome email sent with a magic link to set the password

---

### F4 — Edit Tenant · `src/app/(private)/tenants/[id]/edit/page.tsx`

Same sections as the creation form, organized into **tabs** (not steps):

- **Tab 1:** Company Data
- **Tab 2:** Store (slug / domain)
- **Tab 3:** Visual Identity
- **Tab 4:** Bank Details

**Read-only fields after creation:** CNPJ · Type (with explanatory tooltip)

---

### F5 — Manage Products · `src/app/(private)/tenants/[id]/products/page.tsx`

For each active Vello product:

```
┌─────────────────────────────────────────────────────────┐
│ FGTS — Birthday Withdrawal                [Toggle]      │
├─────────────────────────────────────────────────────────┤
│ Bank pays Vello:          10.0000%                      │
│ Vello retains:             5.0000%                       │
│ Available to tenant:       5.0000%                       │
│                                                         │
│ Tenant Commission:  [___3.5000___] %                    │
│ Vello Spread (auto):       1.5000%  ← calculated in real time
└─────────────────────────────────────────────────────────┘
```

**Criteria:**
- [ ] Commission pre-filled with the tenant's plan default
- [ ] Vello spread calculated and shown in real time
- [ ] Error if commission > available to tenant
- [ ] Toggle off: `is_active = false` (record kept for history)

---

### F6 — Suspend / Cancel / Reactivate

| Current status | Available actions |
|---|---|
| `pending` | Activate · Cancel |
| `active` | Suspend · Cancel |
| `suspended` | Reactivate · Cancel |
| `cancelled` | — read-only |

**Suspension:** Console proxy blocks access · data preserved · `suspended_at` filled in

**Cancellation:** irreversible · modal requires typing the tenant name · soft delete via status

---

### F7 — Tenant Details · `src/app/(private)/tenants/[id]/page.tsx`

**Two-column layout:**

Left column (2/3) with tabs:
- **Registration Data** — company data, slug, domain
- **Products** — enabled products and commissions
- **Financial** — metrics and statement (placeholder)
- **Visual Identity** — branding preview + edit link

Right column (1/3):
- Actions card (activate / suspend / edit)
- Thumbnail preview of the sign-in screen (white-label)
- Quick metrics: proposals, volume, commissions generated

---

## Public Screens Customization — Console

### Branding resolution flow

```
GET creditos.empresa.com.br/sign-in
  ↓
Console proxy (proxy.ts)
  ↓
SELECT * FROM tenants WHERE custom_domain = hostname
SELECT * FROM tenant_branding WHERE tenant_id = tenant.id
  ↓
Injects headers:
  x-tenant-id: uuid
  x-tenant-branding: JSON.stringify(branding)
  ↓
(public)/layout.tsx reads the headers
  ↓
Applies CSS variables + renders layout with the tenant's branding
```

### Public screens layout — `apps/console/src/app/(public)/layout.tsx` (reads headers injected by `proxy.ts`)

Based on the client's white-label screenshot (40/60 split, dark theme):

```
┌──────────────── 40% ────────────────┬─────────── 60% ────────────┐
│ background: auth_bg_color           │                             │
│                                     │  auth_bg_image_url          │
│ [tenant logo — top left]           │  (object-cover)             │
│                                     │                             │
│       [children — form]            │  Fallback if no image:      │
│       vertically centered          │  gradient                  │
│                                     │  primary_color →            │
│                                     │  secondary_color            │
│                                     │                             │
└─────────────────────────────────────┴─────────────────────────────┘
```

**CSS variables injected by the layout:**
```css
--tenant-primary:       primary_color
--tenant-primary-hover: primary_color 10% darker (calculated)
--tenant-bg:            auth_bg_color
--tenant-text:          calculated by contrast with auth_bg_color
```

**Public screens using this layout:**
- `/sign-in` — login form
- `/forgot-password` — request password reset
- `/reset-password` — set new password (magic link)

**Acceptance Criteria:**
- [ ] Responsive 40/60 split layout (on mobile: stacked, image hidden)
- [ ] Tenant logo at the top left, fallback to the Vello logo
- [ ] Button uses `--tenant-primary` as background
- [ ] No image: right panel shows a `primary → secondary` gradient
- [ ] Dark/light theme based on `auth_theme` from the branding
- [ ] Subscription without custom branding: standard Vello layout

---

## Supabase Storage

```
Bucket: tenant-assets (public access via signed URLs)

tenant-assets/
└── [tenant_id]/
    ├── logo          ← logo_url
    ├── favicon       ← favicon_url
    └── auth-bg       ← auth_bg_image_url
```

**Upload Server Action:**
```typescript
// Use createServiceClient() from @/lib/supabase/service — never expose to the browser
const supabase = createServiceClient()
const { data } = await supabase.storage
  .from('tenant-assets')
  .upload(`${tenantId}/logo`, file, { upsert: true })

const { data: { publicUrl } } = supabase.storage
  .from('tenant-assets')
  .getPublicUrl(`${tenantId}/logo`)

// Save publicUrl in tenant_branding.logo_url
```

---

## Files to Create

```
apps/admin/src/app/(private)/tenants/
├── page.tsx
├── new/page.tsx
├── [id]/
│   ├── page.tsx
│   ├── edit/page.tsx
│   └── products/page.tsx
├── actions.ts
├── queries.ts
└── _components/
    ├── tenant-table.tsx
    ├── tenant-type-badge.tsx
    ├── tenant-status-badge.tsx
    ├── tenant-status-actions.tsx
    ├── tenant-form-steps.tsx
    ├── tenant-branding-form.tsx
    ├── tenant-branding-preview.tsx   ← real-time preview of the sign-in screen
    └── tenant-products-manager.tsx

apps/console/src/app/(public)/
├── layout.tsx                        ← 40/60 split with the tenant's branding
├── sign-in/page.tsx
├── forgot-password/page.tsx
└── reset-password/page.tsx

supabase/migrations/
├── 20260401130000_create_tenants.sql
├── 20260401131000_create_tenant_branding.sql
├── 20260401132000_create_tenant_branding_trigger.sql
└── 20260401140000_create_tenant_products.sql
```

---

## Out of Scope for This Feature

- Self-service onboarding by the tenant itself
- Automatic monthly billing
- Automatic subdomain provisioning via the Vercel API
- Tenant editing its own branding through the Console
- Multiple users per tenant (only 1 `tenant_admin` for now)
