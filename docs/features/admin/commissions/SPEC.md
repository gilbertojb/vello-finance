# Feature Spec — Snapshots de Comissão

**App:** Transversal (trigger no banco, exibição em `apps/admin` e `apps/console`)
**Módulo:** Admin / Comissões
**Status:** `ready-for-dev`

---

## Regra de Negócio

Percentuais mudam ao longo do tempo. O snapshot captura os valores vigentes no momento
exato da criação de cada proposta. É **append-only** — nunca atualizar ou deletar.

### Exemplo com empréstimo de R$ 10.000

| Parte | % | Valor |
|---|---|---|
| Banco paga à Vello | 10,0000% | R$ 1.000,00 |
| Vello retém | 5,0000% | R$ 500,00 |
| Tenant recebe | 3,5000% | R$ 350,00 |
| Vello spread | 1,5000% | R$ 150,00 |
| **Total Vello** | **6,5000%** | **R$ 650,00** |
| **Total Tenant** | **3,5000%** | **R$ 350,00** |

---

## F1 — Captura Automática (trigger)

**Quando:** INSERT em `proposals`
**Como:** trigger PostgreSQL AFTER INSERT com SECURITY DEFINER

```sql
CREATE OR REPLACE FUNCTION capture_commission_snapshot()
RETURNS TRIGGER AS $$
DECLARE
  v_product        products%ROWTYPE;
  v_tenant_product tenant_products%ROWTYPE;
BEGIN
  SELECT * INTO v_product FROM products WHERE id = NEW.product_id;

  SELECT * INTO v_tenant_product FROM tenant_products
  WHERE tenant_id = NEW.tenant_id
    AND product_id = NEW.product_id
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não habilitado para este tenant';
  END IF;

  INSERT INTO commission_snapshots (
    proposal_id, product_id, tenant_id,
    bank_commission_pct, vello_commission_pct,
    tenant_commission_pct, vello_spread_pct
  ) VALUES (
    NEW.id, NEW.product_id, NEW.tenant_id,
    v_product.bank_commission_pct,
    v_product.vello_commission_pct,
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

**Aceite:**
- [ ] Snapshot criado para toda nova proposta
- [ ] Proposta rejeitada se produto não habilitado para o tenant
- [ ] Snapshot preservado após alterações futuras em products ou tenant_products

---

## F2 — Cálculo em R$ (quando proposta aprovada)

Server Action disparada ao mudar status para `approved`:

```typescript
// Pseudo-código
const snap = await getSnapshotByProposalId(proposalId)
const amount = proposal.approved_amount

await updateSnapshot(snap.id, {
  loan_amount: amount,
  bank_commission_amount:   amount * snap.bank_commission_pct,
  vello_commission_amount:  amount * snap.vello_commission_pct,
  tenant_commission_amount: amount * snap.tenant_commission_pct,
})
```

**Aceite:**
- [ ] Cálculo apenas quando `status → 'approved'`
- [ ] Idempotente: não recalcula se `loan_amount` já preenchido

---

## F3 — Exibição na Proposta

Componente `<CommissionSnapshotPanel />` exibido na aba "Comissões" de qualquer proposta:

```
Comissões desta Proposta
(Valores fixados em 01/04/2026)

Valor do Empréstimo:          R$ 10.000,00

Banco paga à Vello:  10,0000%   R$  1.000,00
Vello retém:          5,0000%   R$    500,00
─────────────────────────────────────────────
Tenant recebe:        3,5000%   R$    350,00
Spread Vello:         1,5000%   R$    150,00
─────────────────────────────────────────────
Total Vello Finance:  6,5000%   R$    650,00
```

Nota de rodapé: *"Percentuais fixados em [data]. Alterações posteriores não afetam esta proposta."*

**Aceite:**
- [ ] Sempre exibe percentuais do snapshot (nunca os valores atuais do produto)
- [ ] Valores em R$ exibidos apenas se proposta aprovada

---

## Proteções de Integridade

```sql
-- Bloqueia UPDATE
CREATE POLICY "snapshots_immutable_no_update" ON commission_snapshots
  FOR UPDATE USING (false);

-- Bloqueia DELETE
CREATE POLICY "snapshots_immutable_no_delete" ON commission_snapshots
  FOR DELETE USING (false);
```

---

## Arquivos a Criar

```
apps/admin/components/commissions/
└── CommissionSnapshotPanel.tsx   ← reutilizado em admin e console

supabase/migrations/
├── 20260401150000_create_commission_snapshots.sql
└── 20260401160000_create_commission_trigger.sql
```
