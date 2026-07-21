# Feature Spec — Commission Snapshots

**App:** Cross-cutting (database trigger, displayed in `apps/admin` and `apps/console`)
**Module:** Admin / Commissions
**Status:** `ready-for-dev`

---

## Business Rule

Percentages change over time. The snapshot captures the values in effect at the exact
moment each proposal is created. It is **append-only** — never update or delete.

The financial partner's commission is defined per **product + financial partner** pair (`product_financial_partners`).
A proposal must reference the specific financial partner used so the trigger captures the correct percentages.

### Example with a R$ 10,000 loan

| Part | % | Amount |
|---|---|---|
| Financial partner pays Vello | 10.0000% | R$ 1,000.00 |
| Vello retains | 5.0000% | R$ 500.00 |
| Tenant receives | 3.5000% | R$ 350.00 |
| Vello spread | 1.5000% | R$ 150.00 |
| **Vello Total** | **6.5000%** | **R$ 650.00** |
| **Tenant Total** | **3.5000%** | **R$ 350.00** |

---

## F1 — Automatic Capture (trigger)

**When:** INSERT on `proposals`
**How:** PostgreSQL AFTER INSERT trigger with SECURITY DEFINER

```sql
CREATE OR REPLACE FUNCTION capture_commission_snapshot()
RETURNS TRIGGER AS $$
DECLARE
  v_product_partner    product_financial_partners%ROWTYPE;
  v_tenant_product     tenant_products%ROWTYPE;
BEGIN
  -- Busca comissão da IF para este produto específico
  SELECT * INTO v_product_partner FROM product_financial_partners
  WHERE product_id = NEW.product_id
    AND financial_partner_id = NEW.financial_partner_id
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Instituição financeira não vinculada a este produto';
  END IF;

  SELECT * INTO v_tenant_product FROM tenant_products
  WHERE tenant_id = NEW.tenant_id
    AND product_id = NEW.product_id
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não habilitado para este tenant';
  END IF;

  INSERT INTO commission_snapshots (
    proposal_id, product_id, tenant_id, financial_partner_id,
    if_commission_pct, vello_commission_pct,
    tenant_commission_pct, vello_spread_pct
  ) VALUES (
    NEW.id, NEW.product_id, NEW.tenant_id, NEW.financial_partner_id,
    v_product_partner.if_commission_pct,
    v_product_partner.vello_commission_pct,
    v_tenant_product.tenant_commission_pct,
    v_tenant_product.vello_spread_pct
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_capture_commission_snapshot
  AFTER INSERT ON proposals
  FOR EACH ROW EXECUTE FUNCTION capture_commission_snapshot();
```

**Acceptance:**
- [ ] Snapshot created for every new proposal
- [ ] Proposal rejected if the financial partner is not linked to the product
- [ ] Proposal rejected if the product is not enabled for the tenant
- [ ] Snapshot preserved after future changes to `product_financial_partners` or `tenant_products`

---

## F2 — Calculation in R$ (when proposal is approved)

Server Action triggered when status changes to `approved`:

```typescript
// Pseudo-código
const snap = await getSnapshotByProposalId(proposalId)
const amount = proposal.approved_amount

await updateSnapshot(snap.id, {
  loan_amount: amount,
  if_commission_amount:     amount * snap.if_commission_pct,
  vello_commission_amount:  amount * snap.vello_commission_pct,
  tenant_commission_amount: amount * snap.tenant_commission_pct,
})
```

**Acceptance:**
- [ ] Calculation only happens when `status → 'approved'`
- [ ] Idempotent: does not recalculate if `loan_amount` is already filled in

---

## F3 — Display on the Proposal

`<CommissionSnapshotPanel />` component displayed on the "Commissions" tab of any proposal:

```
Commissions for This Proposal
(Values fixed on 01/04/2026)

Loan Amount:                  R$ 10,000.00

Financial partner pays Vello: 10.0000%   R$  1,000.00
Vello retains:                 5.0000%   R$    500.00
─────────────────────────────────────────────
Tenant receives:               3.5000%   R$    350.00
Vello Spread:                  1.5000%   R$    150.00
─────────────────────────────────────────────
Vello Finance Total:           6.5000%   R$    650.00
```

Footnote: *"Percentages fixed on [date]. Later changes do not affect this proposal."*

**Acceptance:**
- [ ] Always displays the snapshot percentages (never the current values)
- [ ] R$ amounts shown only if the proposal is approved

---

## Integrity Protections

```sql
-- Bloqueia UPDATE
CREATE POLICY "snapshots_immutable_no_update" ON commission_snapshots
  FOR UPDATE USING (false);

-- Bloqueia DELETE
CREATE POLICY "snapshots_immutable_no_delete" ON commission_snapshots
  FOR DELETE USING (false);
```

---

## Files to Create

```
apps/admin/src/components/commissions/
└── commission-snapshot-panel.tsx   ← reutilizado em admin e console

supabase/migrations/
├── YYYYMMDDHHMMSS_create_commission_snapshots.sql
└── YYYYMMDDHHMMSS_create_commission_trigger.sql
```

## Implementation Constraints

- `page.tsx` is a Server Component — fetches data directly from the Supabase server client
- `_components/commission-snapshot-panel.tsx` is a Client Component — receives `snapshot` via props, with no database access
- `actions.ts` uses `'use server'` — the sole mutation point, never exported to the client
- `queries.ts` is imported only by Server Components and Actions — never by Client Components
