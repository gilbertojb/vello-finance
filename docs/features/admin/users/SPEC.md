# Feature Spec — Backoffice User Management

**App:** `apps/admin` — Vello Admin
**Module:** Admin / Users
**UI Terminology:** "Usuários" (database keeps `backoffice_users`)
**Status:** `pending`
**Priority:** High

## Implementation Status

| Feature | Status | Notes |
|---|---|---|
| F1 — Listing | Pending | — |
| F2 — Registration | Pending | — |
| F3 — Edit | Pending | — |
| F4 — Deactivate/Activate | Pending | — |
| F5 — Delete | Pending | — |

## Technical Decisions

- Email comes from `auth.users.email` (join) — not duplicated in `backoffice_users`
- Password set by the admin at registration (no welcome email)
- On edit, the "Generate new password" field is optional — only updates if filled in
- Anti-self protection (deactivate/delete) via CASL conditions, not RLS
- Delete exclusive to `super_admin` via CASL — RLS allows writes for both (`super_admin`, `admin`)
- `deactivate` action added to CASL's `userSubject` for permission granularity

---

## Data Model

### `backoffice_users` table (existing)

```sql
CREATE TYPE backoffice_role AS ENUM ('super_admin', 'admin', 'financial', 'support');

CREATE TABLE backoffice_users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       backoffice_role NOT NULL DEFAULT 'support',
  full_name  TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Current RLS

```sql
-- All backoffice roles can read
CREATE POLICY "backoffice_full_read" ON backoffice_users
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

-- Only super_admin can write (WILL BE UPDATED)
CREATE POLICY "super_admin_write" ON backoffice_users
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = 'super_admin'
  ) WITH CHECK (
    (auth.jwt() ->> 'user_role') = 'super_admin'
  );
```

### RLS — new migration

Adjust the write policy to include `admin`:

```sql
DROP POLICY "super_admin_write" ON backoffice_users;

CREATE POLICY "admin_write" ON backoffice_users
  FOR ALL
  USING (
    (auth.jwt() ->> 'user_role') IN ('super_admin', 'admin')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_role') IN ('super_admin', 'admin')
  );
```

The restriction of delete to `super_admin` only and the anti-self protection are enforced at the application layer (Server Actions + CASL), not in RLS.

---

## Permissions

### Permission matrix

| Action | super_admin | admin | financial / support |
|---|---|---|---|
| List | yes | yes | yes |
| Create | yes | yes | — |
| Edit | yes | yes | — |
| Deactivate/activate | yes | yes | — |
| Permanently delete | yes | — | — |
| Self-deactivate | — | — | — |
| Self-delete | — | — | — |

### CASL (`packages/auth`)

Add `deactivate` to `userSubject`:

```typescript
// subjects/user.ts
import { z } from 'zod'
import { userSchema } from '../models/user'

export const userSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
    z.literal('deactivate'),
  ]),
  z.union([z.literal('User'), userSchema]),
])
```

Update permissions:

```typescript
// permissions.ts
super_admin(user, { can, cannot }) {
  can('manage', 'all')
  cannot('delete', 'User', { id: { $eq: user.id }})
  cannot('deactivate', 'User', { id: { $eq: user.id }})
},
admin(user, { can, cannot }) {
  can('manage', 'User')
  cannot('delete', 'User')
  cannot('deactivate', 'User', { id: { $eq: user.id }})
},
financial(_user, { can }) {
  // ... existing permissions ...
  can('get', 'User')
},
support(_user, { can }) {
  // ... existing permissions ...
  can('get', 'User')
},
```

Check in actions and in the UI:

```typescript
import { userSchema } from '@vello/auth'

// Parses the database record — injects __typename: 'User' via .default()
const targetUser = userSchema.parse(backofficeUser)

// Permission by role (no condition) — pass a string
ability.can('create', 'User')

// Permission with anti-self condition — pass the parsed object
ability.can('delete', targetUser)      // false if self (super_admin) or always (admin)
ability.can('deactivate', targetUser)  // false if self
```

---

## Features

### F1 — Listing · `src/app/(private)/users/page.tsx`

**Table columns:** Name · Email · Role · Status · Actions

**Row actions (visible according to CASL permission):**
- Edit (`can('update', target)`)
- Deactivate/Activate (`can('deactivate', target)` — hidden for self)
- Delete (`can('delete', target)` — super_admin only, hidden for self)

**Acceptance Criteria:**
- [ ] Role badge with semantic colors
- [ ] Status badge: Active (green) / Inactive (gray)
- [ ] "New user" button in the header (visible if `can('create', 'User')`)
- [ ] Confirmation modal for deactivate and delete

---

### F2 — Registration · `src/app/(private)/users/new/page.tsx`

Simple form (no steps/tabs):

| Field | Type | Required | Validation |
|---|---|---|---|
| Email | input text | Yes | Email format |
| Full name | input text | Yes | 2–100 chars |
| Role | select | Yes | super_admin, admin, financial, support |
| Generate password | input text | Yes | Minimum 8 characters |

**Flow (Server Action with `createServiceClient()`):**

```typescript
// 1. Create user in Supabase Auth
const { data: authUser } = await serviceClient.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})

// 2. Insert into backoffice_users
await supabase.from('backoffice_users').insert({
  id: authUser.user.id,
  role,
  full_name,
})
```

**Acceptance Criteria:**
- [ ] Error if the email already exists (Supabase Auth returns an error)
- [ ] Redirect to `/users` after success with a toast
- [ ] Only `super_admin` and `admin` can access this page

---

### F3 — Edit · `src/app/(private)/users/[id]/edit/page.tsx`

| Field | Type | Required | Detail |
|---|---|---|---|
| Email | input text | — | Readonly (not editable) |
| Full name | input text | Yes | 2–100 chars |
| Role | select | Yes | super_admin, admin, financial, support |
| Active | toggle switch | Yes | Visible according to permission |
| Generate new password | input text | No | If filled in, updates the password |

**Flow:**

```typescript
// 1. Update in backoffice_users
await supabase.from('backoffice_users')
  .update({ full_name, role, is_active })
  .eq('id', targetId)

// 2. If password filled in:
await serviceClient.auth.admin.updateUserById(targetId, { password })
```

**Acceptance Criteria:**
- [ ] Email shown but not editable
- [ ] Password field label: "Generate new password" (different from create)
- [ ] Active toggle hidden for the current user (anti-self via CASL)
- [ ] Success toast after saving

---

### F4 — Deactivate / Activate

**Trigger:** Button in the table (F1) or toggle in edit (F3)

**Anti-self protection:** `ability.can('deactivate', target)` returns `false` when `target.id === currentUser.id`

**Acceptance Criteria:**
- [ ] Confirmation modal before deactivating
- [ ] Deactivated user cannot log in (auth hook checks `is_active`)
- [ ] Button hidden on the current user's row

---

### F5 — Permanently Delete

**Trigger:** Button in the table (F1), visible only to `super_admin`

**Flow:**

```typescript
// 1. Delete from backoffice_users
await supabase.from('backoffice_users').delete().eq('id', targetId)

// 2. Delete from Supabase Auth
await serviceClient.auth.admin.deleteUser(targetId)
```

**Acceptance Criteria:**
- [ ] Confirmation modal before deleting
- [ ] Button visible only to `super_admin` and hidden for self
- [ ] Redirect to `/users` if deleted from the edit page

---

## Validation (Zod)

```typescript
const createUserSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2).max(100),
  role: z.enum(['super_admin', 'admin', 'financial', 'support']),
  password: z.string().min(8),
})

const updateUserSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(2).max(100),
  role: z.enum(['super_admin', 'admin', 'financial', 'support']),
  is_active: z.preprocess((v) => v === 'on' || v === true, z.boolean()),
  password: z.string().min(8).optional().or(z.literal('')),
})
```

---

## Sidebar

Add a "Users" item with the `Users` icon (lucide-react) to the side menu.

---

## Files to Create

```
apps/admin/src/app/(private)/users/
├── page.tsx              ← listing (Server Component)
├── new/page.tsx          ← creation
├── [id]/edit/page.tsx    ← edit
├── queries.ts            ← reusable queries
├── actions.ts            ← server actions
└── _components/
    ├── user-table.tsx    ← table with badges + actions
    └── user-form.tsx     ← shared form (create/edit)

supabase/migrations/
└── YYYYMMDD_update_backoffice_users_rls.sql  ← new policy
```

---

## Out of Scope for This Feature

- Own user profile (will be done via `profile-button.tsx`)
- Avatar upload
- Action history / audit log
- MFA authentication
- Admin management of `tenant_users` (separate feature)
