# ADR-001: Immutable Commission Snapshots

**Date:** April 2026 · **Status:** Accepted

## Context

Commission percentages change over time. The system needs to accurately calculate and
audit what each party received on each proposal, even if the rules in effect have
changed since then.

## Decision

`commission_snapshots` **append-only** table (no UPDATE, no DELETE), populated
automatically via a PostgreSQL trigger on INSERT of each proposal.

Immutability enforced at two levels:
1. RLS policies block UPDATE and DELETE
2. Trigger uses SECURITY DEFINER — no exposure to the client

## Consequences

**Positive:** perfect audit trail · future changes don't affect old proposals ·
CNAB always uses correct historical data · compliance with financial market audits.

**Negative:** join required for queries · fixing a wrong snapshot requires a
formal reversal process (direct editing is not possible).

## Alternatives Discarded

**Saving percentages directly on the proposal:** doesn't capture all levels of the cascade.
**Table versioning:** more complex to query. Snapshot is sufficient for the use case.
