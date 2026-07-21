# ADR-002: White-Labels as Instances, not Repositories

**Date:** April 2026 · **Status:** Accepted

## Context

The platform offers white-label where each client has their own domain and visual identity.
The initial approach considered was creating a separate repository or branch per client.

## Decision

White-labels are **data in the database**, not separate code. Each white-label is a tenant
with `custom_domain` filled in. Routing is handled by Next.js middleware that reads
the hostname and resolves the corresponding tenant_id. Vercel manages custom domains
via a programmatic API.

```
New white-label contracted
  → INSERT into tenants (custom_domain filled in)
  → Client points CNAME in DNS
  → Vercel API registers the domain + automatic SSL
  → Store and Console respond on the new domain with the tenant's identity
```

Zero new code. Zero deploy. Zero new repository.

## Consequences

**Positive:** white-label onboarding operational without engineering team involvement ·
centralized maintenance (a bug fix in one place fixes all white-labels) ·
linear scaling without growing operational complexity.

**Negative:** highly specific customizations for a single white-label can't be made
without affecting all of them (mitigated by the database-driven configuration system: colors, logo, products, texts).

## Alternatives Discarded

**Repository per client:** unfeasible — every new contract requires engineering work,
duplicated migrations, and the impossibility of updating all clients simultaneously.

**Branch per client:** same problem, with additional merge conflicts.
