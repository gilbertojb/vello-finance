# Client document portal

Public Store portal where the end client uploads pending proposal documents, authenticating only with CPF.

## How it works

1. Client accesses `https://<tenant>/meus-documentos`
2. Enters CPF — we go through rate limiting and hashing; we never query by cleartext CPF
3. Receives a JWT cookie (httpOnly, 30 min) scoped to the route
4. Sees their proposals for that tenant (filtered by `client_cpf_hash`)
5. Opens a proposal and uploads pending documents (PDF/JPG/PNG/WEBP/HEIC, ≤10MB)

## Security

- **CPF hash** (sha256 with namespace-separated pepper for CPF/IP/UA)
- **Rate limit** 5/15min per IP, 10/h per CPF
- **Signed JWT** (HS256, 30min, httpOnly + secure + sameSite=strict cookie, path `/meus-documentos`)
- **Strict validation** of files: Zod + magic bytes sniffing via `file-type`; renamed to UUID; storage path `{tenant_id}/{proposal_id}/{document_type}/{uuid}.{ext}`
- **Audit log** in `proposal_document_access_log`
- **Generic messages** — we never confirm whether a CPF has proposals
- **Cross-tenant verification** — JWT.tenant_id must match `x-tenant-id` on every request
- **Headers** — `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow` applied via proxy on `/meus-documentos/*`

## Where to touch

- Migration: `supabase/migrations/20260613120000_client_document_portal.sql`
- Helpers: `apps/store/src/app/(store)/meus-documentos/_lib/`
- Server Actions: `apps/store/src/app/(store)/meus-documentos/actions.ts`
- Queries: `apps/store/src/app/(store)/meus-documentos/queries.ts`
- Pages: `apps/store/src/app/(store)/meus-documentos/`
- Proxy headers: `apps/store/src/proxy.ts`
- Console helper: `apps/console/src/lib/tenant/portal-url.ts`
- Console card: `apps/console/src/app/(private)/proposals/[id]/_components/client-share-card.tsx`
- Hook on new proposals: `apps/store/src/app/(store)/contratar/actions.ts` (fills `client_cpf_hash` in `createProposal`/`saveStep`)
- Backfill for existing proposals: `scripts/backfill-cpf-hash.ts`

## Environment variables

- `SUPABASE_CPF_PEPPER` (≥32 chars) — used by store, console, and the backfill script to generate namespace-separated hashes for CPF/IP/UA
- `CLIENT_SESSION_SECRET` (≥32 chars) — HS256 signing for the client session JWT
- `STORE_BASE_DOMAIN` — also present in console, used by `getPortalUrl()` to build the URL `https://{slug}.{baseDomain}/meus-documentos` when the tenant has no `custom_domain`

## Unit tests

`apps/store/src/app/(store)/meus-documentos/_lib/__tests__/` — vitest covering `hashCpf/hashIp/hashUserAgent`, `signClientSession/verifyClientSession`, rate limit constants + `isOverLimit`, and the critical branches of `validateUploadedFile` (valid PNG, valid PDF, empty, blocked SVG, magic mismatch, > 10MB).

I/O functions (`checkRateLimit`, `recordAttempt`, `logAccess`, queries) are validated by the smoke test and in integration.

## Future: Passwordless

Replace CPF-only validation with OTP (SMS/email) or password. When we implement it:

- Keep rate-limit, audit log, session and cookie structure
- Add a `clients` table (or use `auth.users` with a `client` role)
- Swap `validateCpfAction` for `requestOtpAction` + `verifyOtpAction`
- Extend session TTL (24h+ with refresh)
- Keep `client_cpf_hash` as the key between authenticated identity and proposals

A note at the top of the comment in `_lib/session.ts` marks the point of evolution.
