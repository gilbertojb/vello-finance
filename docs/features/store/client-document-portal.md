# Portal de documentos do cliente

Portal público da Store onde o cliente final envia documentos pendentes de propostas autenticando-se apenas com CPF.

## Como funciona

1. Cliente acessa `https://<tenant>/meus-documentos`
2. Informa CPF — passamos por rate limit e hash; nunca consultamos por CPF cleartext
3. Recebe cookie JWT (httpOnly, 30 min) scoped à rota
4. Vê suas propostas naquele tenant (filtradas por `client_cpf_hash`)
5. Entra em uma proposta e envia documentos pendentes (PDF/JPG/PNG/WEBP/HEIC, ≤10MB)

## Segurança

- **Hash de CPF** (sha256 com pepper namespace-separado para CPF/IP/UA)
- **Rate limit** 5/15min por IP, 10/h por CPF
- **JWT assinado** (HS256, 30min, cookie httpOnly + secure + sameSite=strict, path `/meus-documentos`)
- **Validação rígida** de arquivos: Zod + sniff de magic bytes via `file-type`; rename para UUID; storage path `{tenant_id}/{proposal_id}/{document_type}/{uuid}.{ext}`
- **Audit log** em `proposal_document_access_log`
- **Mensagens genéricas** — nunca confirmamos se um CPF tem propostas
- **Verificação cross-tenant** — JWT.tenant_id deve bater com `x-tenant-id` em cada request
- **Headers** — `Cache-Control: no-store` e `X-Robots-Tag: noindex, nofollow` aplicados via proxy em `/meus-documentos/*`

## Onde tocar

- Migration: `supabase/migrations/20260613120000_client_document_portal.sql`
- Helpers: `apps/store/src/app/(store)/meus-documentos/_lib/`
- Server Actions: `apps/store/src/app/(store)/meus-documentos/actions.ts`
- Queries: `apps/store/src/app/(store)/meus-documentos/queries.ts`
- Páginas: `apps/store/src/app/(store)/meus-documentos/`
- Headers no proxy: `apps/store/src/proxy.ts`
- Helper no console: `apps/console/src/lib/tenant/portal-url.ts`
- Card no console: `apps/console/src/app/(private)/proposals/[id]/_components/client-share-card.tsx`
- Hook em propostas novas: `apps/store/src/app/(store)/contratar/actions.ts` (preenche `client_cpf_hash` em `createProposal`/`saveStep`)
- Backfill propostas existentes: `scripts/backfill-cpf-hash.ts`

## Variáveis de ambiente

- `SUPABASE_CPF_PEPPER` (≥32 chars) — usado por store, console e pelo script de backfill para gerar hashes namespace-separated de CPF/IP/UA
- `CLIENT_SESSION_SECRET` (≥32 chars) — assinatura HS256 do JWT da sessão do cliente
- `STORE_BASE_DOMAIN` — também no console, usado por `getPortalUrl()` para montar a URL `https://{slug}.{baseDomain}/meus-documentos` quando o tenant não tem `custom_domain`

## Testes unitários

`apps/store/src/app/(store)/meus-documentos/_lib/__tests__/` — vitest cobrindo `hashCpf/hashIp/hashUserAgent`, `signClientSession/verifyClientSession`, constantes do rate limit + `isOverLimit`, e os branches críticos de `validateUploadedFile` (PNG válido, PDF válido, vazio, SVG bloqueado, magic mismatch, > 10MB).

Funções de I/O (`checkRateLimit`, `recordAttempt`, `logAccess`, queries) são validadas pelo smoke test e em integração.

## Futuro: Passwordless

Substituir validação por CPF apenas por OTP (SMS/email) ou senha. Quando implementarmos:

- Manter rate-limit, audit log, estrutura de sessão e cookie
- Adicionar tabela `clients` (ou usar `auth.users` com role `client`)
- Trocar `validateCpfAction` por `requestOtpAction` + `verifyOtpAction`
- Estender TTL de sessão (24h+ com refresh)
- Manter `client_cpf_hash` como chave entre identidade autenticada e propostas

Note no comentário do topo de `_lib/session.ts` indica o ponto de evolução.
