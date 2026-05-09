# Vello Store — Redesign Visual (ZP Pay) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign completo do visual do Vello Store aplicando a linguagem do ZP Pay: dark fixo, Poppins + Playfair Display, gold como primária, 5 seções na home, PMT no simulador.

**Architecture:** CSS variables redefinidas em globals.css para paleta dark ZP Pay; fontes Poppins + Playfair Display via next/font/google; `--surface`/`--surface-foreground` como tokens customizados para seções claras; sem toggle .dark — tema dark é fixo no :root.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4, shadcn/ui, next/font/google, lucide-react, @react-input/mask

---

## Task 1: CSS Variables + Fontes

**Files:**
- Modify: `apps/store/src/app/globals.css`
- Modify: `apps/store/src/app/layout.tsx`

- [ ] **Step 1.1: Reescrever globals.css**

Substituir os blocos `:root {}` e `.dark {}` existentes. Manter tudo acima e abaixo intacto (imports, @theme inline, @layer base). Apenas substituir os valores de `:root` e remover `.dark`:

```css
:root {
  --background:          oklch(0.08 0.008 55);
  --foreground:          oklch(0.96 0.015 88);
  --card:                oklch(0.12 0.008 52);
  --card-foreground:     oklch(0.96 0.015 88);
  --popover:             oklch(0.12 0.008 52);
  --popover-foreground:  oklch(0.96 0.015 88);
  --primary:             oklch(0.83 0.10 85);
  --primary-foreground:  oklch(0.25 0.04 45);
  --secondary:           oklch(0.16 0.008 52);
  --secondary-foreground: oklch(0.96 0.015 88);
  --muted:               oklch(0.16 0.008 52);
  --muted-foreground:    oklch(0.72 0.01 88);
  --accent:              oklch(0.83 0.10 85);
  --accent-foreground:   oklch(0.25 0.04 45);
  --destructive:         oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.96 0.015 88);
  --border:              oklch(0.83 0.10 85 / 0.12);
  --input:               oklch(0.96 0.015 88 / 0.18);
  --ring:                oklch(0.83 0.10 85);
  --radius:              0.625rem;
  --surface:             oklch(0.94 0.018 88);
  --surface-foreground:  oklch(0.12 0.01 50);
}
```

No bloco `@theme inline`, adicionar após `--font-sans: var(--font-sans);`:

```css
  --font-serif: var(--font-serif);
  --color-surface: var(--surface);
  --color-surface-foreground: var(--surface-foreground);
```

- [ ] **Step 1.2: Reescrever layout.tsx**

```typescript
import './globals.css'
import { Poppins, Playfair_Display } from 'next/font/google'
import { GeistMono } from 'geist/font/mono'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { getTenantBranding } from '@/lib/branding'
import { createServiceClient } from '@/lib/supabase/service'
import { cn } from '@/lib/utils'
import { Providers } from './providers'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '700'],
  variable: '--font-serif',
  display: 'swap',
})

const FORBIDDEN_CSS_PATTERNS = [
  /url\s*\(/i,
  /@import/i,
  /expression\s*\(/i,
  /javascript\s*:/i,
  /-moz-binding/i,
  /behavior\s*:/i,
]

function isSafeCss(css: string): boolean {
  return !FORBIDDEN_CSS_PATTERNS.some((p) => p.test(css))
}

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  const branding = await getTenantBranding(tenantId)
  return {
    title: branding?.company_display_name
      ? { template: `%s | ${branding.company_display_name}`, default: branding.company_display_name }
      : { template: '%s | Vello Store', default: 'Vello Store' },
    icons: branding?.favicon_url ? { icon: branding.favicon_url } : undefined,
  }
}

async function getTenantCustomCss(tenantId: string): Promise<string | null> {
  if (!tenantId) return null
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenant_branding')
    .select('use_custom_theme, custom_css')
    .eq('tenant_id', tenantId)
    .single()
  if (!data?.use_custom_theme) return null
  return data.custom_css
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers()
  const tenantSlug = headerStore.get('x-tenant-slug') ?? 'default'
  const tenantId = headerStore.get('x-tenant-id') ?? ''
  const customCss = await getTenantCustomCss(tenantId)

  return (
    <html
      lang="pt-BR"
      className={cn(poppins.variable, playfair.variable, GeistMono.variable)}
      data-tenant-theme={tenantSlug}
      data-tenant-id={tenantId}
      suppressHydrationWarning
    >
      <head>
        {customCss && isSafeCss(customCss) && <style>{customCss}</style>}
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  )
}
```

- [ ] **Step 1.3: Commit**
```bash
git add apps/store/src/app/globals.css apps/store/src/app/layout.tsx
git commit -m "feat(store): CSS variables dark ZP Pay + Poppins + Playfair Display"
```

---

## Task 2: PMT utilities

**Files:**
- Modify: `apps/store/src/lib/utils/simulator.ts`

- [ ] **Step 2.1: Adicionar ao final de simulator.ts**

```typescript
export function calcPMT(pv: number, rateMonthly: number, nper: number): number {
  const r = rateMonthly / 100
  if (r === 0) return pv / nper
  return (pv * (r * Math.pow(1 + r, nper))) / (Math.pow(1 + r, nper) - 1)
}

export function calcCETAnual(rateMonthly: number): number {
  const r = rateMonthly / 100
  return (Math.pow(1 + r, 12) - 1) * 100
}
```

- [ ] **Step 2.2: Commit**
```bash
git add apps/store/src/lib/utils/simulator.ts
git commit -m "feat(store): calcPMT e calcCETAnual em simulator.ts"
```

---

## Task 3: StoreHeader

**Files:**
- Modify: `apps/store/src/app/(store)/_components/store-header.tsx`

- [ ] **Step 3.1: Reescrever store-header.tsx**

```typescript
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  logoUrl: string | null
  displayName: string | null
}

export function StoreHeader({ logoUrl, displayName }: Props) {
  const name = displayName ?? 'Vello Store'
  const initials = name.slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/[0.08] bg-background/85 backdrop-blur-[14px]">
      <div className="mx-auto flex h-[78px] max-w-7xl items-center gap-10 px-8">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-foreground">
          {logoUrl ? (
            <Image src={logoUrl} alt={name} width={120} height={36} className="h-9 w-auto object-contain" />
          ) : (
            <>
              <span
                className="grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-foreground font-extrabold text-[15px] italic tracking-[-0.04em] text-background"
                style={{ transform: 'skewX(-8deg)' }}
              >
                {initials}
              </span>
              <span>{name}</span>
            </>
          )}
        </Link>

        {/* TODO: [White-label] links configuráveis por tenant */}
        <nav className="ml-auto hidden items-center gap-8 text-sm text-foreground/78 md:flex">
          <Link href="#produtos" className="transition-colors hover:text-primary">Produtos</Link>
          <Link href="#como-funciona" className="transition-colors hover:text-primary">Como funciona</Link>
          <Link href="#" className="transition-colors hover:text-primary">Sobre</Link>
        </nav>

        <Link
          href="#produtos"
          className="ml-auto rounded-full bg-gradient-to-b from-primary to-primary/80 px-[22px] py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-10px_oklch(0.83_0.10_85/50%)] transition-all hover:brightness-110 md:ml-0"
        >
          Simular agora
        </Link>
      </div>
    </header>
  )
}
```

- [ ] **Step 3.2: Commit**
```bash
git add apps/store/src/app/(store)/_components/store-header.tsx
git commit -m "feat(store): redesign StoreHeader ZP Pay"
```

---

## Task 4: StoreFooter

**Files:**
- Modify: `apps/store/src/app/(store)/_components/store-footer.tsx`
- Modify: `apps/store/src/app/(store)/layout.tsx` (passar logoUrl ao footer)

- [ ] **Step 4.1: Reescrever store-footer.tsx**

```typescript
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  displayName: string | null
  logoUrl: string | null
}

export function StoreFooter({ displayName, logoUrl }: Props) {
  const name = displayName ?? 'Vello Store'
  const year = new Date().getFullYear()
  const initials = name.slice(0, 2).toUpperCase()

  return (
    <footer className="border-t border-primary/[0.08] bg-background py-12">
      <div className="mx-auto max-w-7xl px-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-foreground">
            {logoUrl ? (
              <Image src={logoUrl} alt={name} width={100} height={32} className="h-8 w-auto object-contain" />
            ) : (
              <>
                <span
                  className="grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-foreground text-sm font-extrabold italic tracking-[-0.04em] text-background"
                  style={{ transform: 'skewX(-8deg)' }}
                >
                  {initials}
                </span>
                <span>{name}</span>
              </>
            )}
          </Link>
          <nav className="flex gap-8 text-xs font-medium uppercase tracking-[.06em]">
            <Link href="#" className="text-foreground/60 transition-colors hover:text-primary">Privacidade</Link>
            <Link href="#" className="text-foreground/60 transition-colors hover:text-primary">Termos</Link>
            <Link href="#" className="text-foreground/60 transition-colors hover:text-primary">Suporte</Link>
          </nav>
        </div>
        <p className="mt-6 text-xs text-foreground/40">© {year} {name} · Todos os direitos reservados.</p>
      </div>
    </footer>
  )
}
```

- [ ] **Step 4.2: Atualizar (store)/layout.tsx**

```typescript
import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { getTenantBranding } from '@/lib/branding'
import { StoreHeader } from './_components/store-header'
import { StoreFooter } from './_components/store-footer'

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id') ?? ''
  const branding = await getTenantBranding(tenantId)

  return (
    <div className="flex min-h-svh flex-col">
      <StoreHeader
        logoUrl={branding?.logo_url ?? null}
        displayName={branding?.company_display_name ?? null}
      />
      <main className="flex-1">{children}</main>
      <StoreFooter
        displayName={branding?.company_display_name ?? null}
        logoUrl={branding?.logo_url ?? null}
      />
    </div>
  )
}
```

- [ ] **Step 4.3: Commit**
```bash
git add apps/store/src/app/(store)/_components/store-footer.tsx apps/store/src/app/(store)/layout.tsx
git commit -m "feat(store): redesign StoreFooter + logoUrl no layout"
```

---

## Task 5: HeroSection

**Files:**
- Modify: `apps/store/src/app/(store)/_components/hero-section.tsx`

Props mudam: remover `bgImageUrl`, adicionar `featuredProductId: string | null` e `minRate: number | null`.

- [ ] **Step 5.1: Reescrever hero-section.tsx**

```typescript
import Link from 'next/link'

type Props = {
  displayName: string | null
  featuredProductId: string | null
  minRate: number | null
}

export function HeroSection({ displayName, featuredProductId, minRate }: Props) {
  const name = displayName ?? 'Vello Store'
  const rateDisplay = minRate != null ? minRate.toFixed(2).replace('.', ',') : '--'

  return (
    <section className="relative overflow-hidden border-b border-primary/[0.08]">
      <div className="mx-auto max-w-7xl px-8">
        <div className="grid grid-cols-[1.05fr_1fr] items-center gap-16 py-24 max-lg:grid-cols-1 max-lg:gap-12">

          {/* Esquerda */}
          <div>
            {/* TODO: [White-label] eyebrow configurável por tenant */}
            <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/28 bg-primary/[0.04] px-3.5 py-2 text-[11px] font-medium uppercase tracking-[.22em] text-primary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
              </span>
              {name} · Crédito feito para você
            </span>

            {/* TODO: [White-label] headline configurável por tenant */}
            <h1 className="mb-5 mt-6 text-7xl font-light leading-none tracking-[-0.025em] max-lg:text-5xl max-sm:text-[38px]">
              Crédito que{' '}
              <em className="font-serif not-italic font-normal text-primary">honra</em>
              <br />
              quem você é<span className="text-primary">.</span>
            </h1>

            {/* TODO: [White-label] lede configurável por tenant */}
            <p className="mb-9 max-w-[520px] text-[17px] leading-relaxed text-foreground/74">
              Empréstimos pessoais, consignados, FGTS e linhas com garantia — taxas competitivas, aprovação digital e respeito por cada história. Simule em 60 segundos.
            </p>

            <div className="flex items-center gap-3.5">
              {featuredProductId && (
                <Link
                  href={`/produto/${featuredProductId}`}
                  className="rounded-full bg-gradient-to-b from-primary to-primary/80 px-[22px] py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-10px_oklch(0.83_0.10_85/50%)] transition-all hover:brightness-110"
                >
                  Simular agora →
                </Link>
              )}
              <Link
                href="#produtos"
                className="rounded-full border border-foreground/18 px-[22px] py-3 text-sm font-medium text-foreground transition-all hover:border-primary hover:text-primary"
              >
                Ver todas as linhas
              </Link>
            </div>

            {/* TODO: [White-label] stats configuráveis por tenant */}
            <div className="mt-9 flex gap-9 border-t border-foreground/[0.08] pt-8 max-sm:hidden">
              {[
                { num: 'R$ 4,2bi', lbl: 'liberados em 2025' },
                { num: `${rateDisplay}%`, lbl: 'menor taxa a.m.' },
                { num: '24h', lbl: 'para o crédito cair' },
              ].map(({ num, lbl }) => (
                <div key={lbl}>
                  <div className="text-[30px] font-semibold leading-none tracking-tight text-primary">{num}</div>
                  <div className="mt-0.5 text-xs text-foreground/50">{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Direita — visual decorativo (oculto em mobile) */}
          <div className="relative h-[560px] max-lg:hidden">
            <div
              className="absolute inset-0 overflow-hidden rounded-3xl border border-primary/12"
              style={{
                background:
                  'radial-gradient(120% 80% at 80% 20%, oklch(0.83 0.10 85 / 0.18), transparent 55%), radial-gradient(80% 60% at 20% 90%, oklch(0.48 0.07 50 / 0.28), transparent 60%), linear-gradient(180deg, oklch(0.15 0.01 50) 0%, oklch(0.08 0.008 55) 100%)',
              }}
            />

            {/* TODO: [White-label] valores dos cards configuráveis */}
            <div className="absolute left-[50px] top-[60px] w-[280px] rounded-[18px] border border-primary/18 bg-card p-[22px] shadow-[0_30px_60px_-20px_black/50]">
              <div className="mb-3.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-[.18em] text-primary">
                <span>Pré-aprovado</span>
                <span className="rounded-full bg-green-500/[0.18] px-2.5 py-1 text-[10px] text-green-400">ATIVO</span>
              </div>
              <div className="text-[36px] font-semibold leading-none tracking-tight text-foreground">
                R$ 38.500<span className="text-base font-normal text-foreground/50"> /50k</span>
              </div>
              <div className="my-[18px] h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]">
                <div className="h-full w-[64%] rounded-full bg-gradient-to-r from-primary/60 to-primary" />
              </div>
              <div className="flex justify-between text-xs text-foreground/55">
                <span>Margem usada</span><span className="text-primary">77%</span>
              </div>
            </div>

            <div className="absolute left-1/2 top-1/2 grid h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-primary/18">
              <div className="absolute inset-[14px] rounded-full border border-dashed border-primary/22" aria-hidden="true" />
              <div className="text-center">
                <div className="font-serif italic text-[64px] font-normal leading-none tracking-tight text-primary">
                  {rateDisplay}<span className="text-2xl">%</span>
                </div>
                <div className="mt-1.5 text-[11px] uppercase tracking-[.22em] text-foreground/55">a.m. · taxa fixa</div>
              </div>
            </div>

            <div className="absolute bottom-[80px] right-[40px] w-[280px] rounded-[18px] bg-surface p-[22px] shadow-[0_30px_60px_-20px_black/50]">
              <div className="text-[11px] font-semibold uppercase tracking-[.18em] text-surface-foreground/60">Parcela mensal</div>
              <div className="mt-1 text-lg font-semibold text-surface-foreground">Crédito Pessoal</div>
              <div className="mt-3.5 text-[36px] font-semibold leading-none tracking-tight text-surface-foreground">
                R$ 312<span className="text-base font-normal text-surface-foreground/45">,40</span>
              </div>
              <div className="my-[18px] h-1.5 overflow-hidden rounded-full bg-surface-foreground/[0.08]">
                <div className="h-full w-[38%] rounded-full bg-primary-foreground" />
              </div>
              <div className="flex justify-between text-xs text-surface-foreground/55">
                <span>14 de 84</span><span>R$ 38.500</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5.2: Commit**
```bash
git add apps/store/src/app/(store)/_components/hero-section.tsx
git commit -m "feat(store): redesign HeroSection floating cards ZP Pay"
```

---

## Task 6: ProductStrip (novo)

**Files:**
- Create: `apps/store/src/app/(store)/_components/product-strip.tsx`

- [ ] **Step 6.1: Criar product-strip.tsx**

```typescript
import Link from 'next/link'
import { Wallet, Shield, Home, Car, Zap, Briefcase } from 'lucide-react'

const TYPE_ICONS: Record<string, React.ElementType> = {
  fgts: Shield,
  consignado_publico: Briefcase,
  consignado_privado: Wallet,
  home_equity: Home,
  auto_equity: Car,
  outros: Zap,
}

const TYPE_LABELS: Record<string, string> = {
  fgts: 'FGTS',
  consignado_publico: 'Consignado',
  consignado_privado: 'Consignado',
  home_equity: 'Garantia',
  auto_equity: 'Veículo',
  outros: 'Crédito',
}

type ChipProduct = {
  id: string
  typeSlug: string
  rate: number | null
}

type Props = {
  products: ChipProduct[]
}

export function ProductStrip({ products }: Props) {
  const seen = new Set<string>()
  const chips = products
    .filter((p) => { if (seen.has(p.typeSlug)) return false; seen.add(p.typeSlug); return true })
    .slice(0, 4)

  if (chips.length === 0) return null

  return (
    <div className="mx-auto max-w-7xl px-8 pb-16">
      <div className="grid grid-cols-4 gap-3.5 max-sm:grid-cols-2">
        {chips.map((chip) => {
          const Icon = TYPE_ICONS[chip.typeSlug] ?? Zap
          const label = TYPE_LABELS[chip.typeSlug] ?? 'Crédito'
          const rate = chip.rate != null ? chip.rate.toFixed(2).replace('.', ',') : '--'
          return (
            <Link
              key={chip.id}
              href={`/produto/${chip.id}`}
              className="group flex items-center gap-3.5 rounded-[14px] border border-foreground/[0.08] bg-foreground/[0.04] p-4 transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary/[0.06]"
            >
              <div className="grid h-[38px] w-[38px] flex-shrink-0 place-items-center rounded-[10px] bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[.2em] text-foreground/50">{label}</div>
                <div className="mt-0.5 text-sm font-semibold text-foreground">{rate}% a.m.</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 6.2: Commit**
```bash
git add apps/store/src/app/(store)/_components/product-strip.tsx
git commit -m "feat(store): ProductStrip — chips por tipo de produto"
```

---

## Task 7: ProductCard redesign

**Files:**
- Modify: `apps/store/src/app/(store)/_components/product-card.tsx`

Interface de props inalterada exceto adição de `featured?: boolean`.

- [ ] **Step 7.1: Reescrever product-card.tsx**

```typescript
import Link from 'next/link'
import { Wallet, Shield, Home, Car, Zap, Briefcase, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/simulator'
import { cn } from '@/lib/utils'

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  fgts: 'FGTS',
  consignado_publico: 'Consignado Público',
  consignado_privado: 'Consignado Privado',
  home_equity: 'Home Equity',
  auto_equity: 'Auto Equity',
  outros: 'Outros',
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  fgts: Shield,
  consignado_publico: Briefcase,
  consignado_privado: Wallet,
  home_equity: Home,
  auto_equity: Car,
  outros: Zap,
}

type Props = {
  tenantProductId: string
  coverUrl: string | null
  productName: string
  productTypeSlug: string | null
  minAmount: number | null
  maxAmount: number | null
  minTermMonths: number | null
  maxTermMonths: number | null
  featured?: boolean
}

export function ProductCard({
  tenantProductId,
  productName,
  productTypeSlug,
  minAmount,
  maxAmount,
  minTermMonths,
  maxTermMonths,
  featured = false,
}: Props) {
  const slug = productTypeSlug ?? 'outros'
  const typeLabel = PRODUCT_TYPE_LABELS[slug] ?? slug
  const Icon = TYPE_ICONS[slug] ?? Zap

  return (
    <Link
      href={`/produto/${tenantProductId}`}
      className={cn(
        'group flex h-full cursor-pointer flex-col overflow-hidden rounded-[20px] border transition-all duration-200 hover:-translate-y-[3px]',
        featured
          ? 'border-primary/18 bg-gradient-to-b from-card to-background text-foreground hover:shadow-[0_30px_50px_-25px_oklch(0.83_0.10_85/20%)]'
          : 'border-black/[0.06] bg-surface text-surface-foreground hover:shadow-[0_30px_50px_-25px_oklch(0.12_0.01_50/15%)]',
      )}
    >
      <div className="flex items-start justify-between px-[26px] pt-6">
        <span className={cn('text-[10px] font-semibold uppercase tracking-[.22em]', featured ? 'text-primary' : 'text-surface-foreground/50')}>
          {typeLabel}
        </span>
      </div>

      <div className={cn('mx-[26px] mt-6 grid h-12 w-12 place-items-center rounded-[12px]', featured ? 'bg-primary/12 text-primary' : 'bg-surface-foreground/[0.08] text-surface-foreground/60')}>
        <Icon className="h-5 w-5" />
      </div>

      {featured && (
        <div
          className="relative mt-2 h-[100px] overflow-hidden border-y border-primary/10"
          style={{ background: 'radial-gradient(60% 80% at 80% 20%, oklch(0.83 0.10 85 / 0.22), transparent 60%), repeating-linear-gradient(45deg, oklch(0.83 0.10 85 / 0.06) 0 1px, transparent 1px 14px)' }}
        >
          <div className="absolute bottom-[18px] left-[26px] flex flex-col gap-1.5">
            <div className="h-[5px] w-[140px] rounded-full bg-primary" />
            <div className="h-[5px] w-[90px] rounded-full bg-primary/40" />
            <div className="h-[5px] w-[60px] rounded-full bg-primary/25" />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col px-[26px] py-[18px]">
        <h3 className={cn('mb-2 leading-tight tracking-tight', featured ? 'text-[28px] font-light' : 'text-[22px] font-semibold')}>
          {featured ? (
            <>{productName.split(' ')[0]}{' '}
              <em className="font-serif not-italic font-normal text-primary">{productName.split(' ').slice(1).join(' ')}</em>
            </>
          ) : productName}
        </h3>

        <div className={cn('mt-auto grid grid-cols-2 gap-3.5 border-t pt-[18px]', featured ? 'border-primary/14' : 'border-black/[0.08]')}>
          {minAmount != null && maxAmount != null && (
            <div>
              <div className={cn('text-[10px] font-medium uppercase tracking-[.16em]', featured ? 'text-foreground/45' : 'text-surface-foreground/45')}>Valor até</div>
              <div className={cn('mt-1 text-lg font-semibold tracking-tight', featured ? 'text-primary' : 'text-surface-foreground')}>{formatCurrency(maxAmount)}</div>
            </div>
          )}
          {minTermMonths != null && maxTermMonths != null && (
            <div>
              <div className={cn('text-[10px] font-medium uppercase tracking-[.16em]', featured ? 'text-foreground/45' : 'text-surface-foreground/45')}>Prazo até</div>
              <div className={cn('mt-1 text-lg font-semibold tracking-tight', featured ? 'text-foreground' : 'text-surface-foreground')}>{maxTermMonths} meses</div>
            </div>
          )}
        </div>
      </div>

      <div className={cn('flex items-center justify-between border-t px-[26px] py-4 text-sm font-semibold', featured ? 'border-primary/14 bg-primary/[0.04] text-primary' : 'border-black/[0.06] bg-black/[0.02] text-surface-foreground/70')}>
        <span>Simular condições</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  )
}
```

- [ ] **Step 7.2: Commit**
```bash
git add apps/store/src/app/(store)/_components/product-card.tsx
git commit -m "feat(store): redesign ProductCard ZP Pay com featured variant"
```

---

## Task 8: ProductsSection (novo Client Component)

**Files:**
- Create: `apps/store/src/app/(store)/_components/products-section.tsx`

- [ ] **Step 8.1: Criar products-section.tsx**

```typescript
'use client'

import { useState } from 'react'
import { ProductCard } from './product-card'
import { cn } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  fgts: 'FGTS',
  consignado_publico: 'Consignado Público',
  consignado_privado: 'Consignado Privado',
  home_equity: 'Home Equity',
  auto_equity: 'Auto Equity',
  outros: 'Outros',
}

type Product = {
  id: string
  coverUrl: string | null
  productName: string
  productTypeSlug: string | null
  minAmount: number | null
  maxAmount: number | null
  minTermMonths: number | null
  maxTermMonths: number | null
}

type Props = { products: Product[] }

export function ProductsSection({ products }: Props) {
  const [activeFilter, setActiveFilter] = useState('todos')

  const types = Array.from(new Set(products.map((p) => p.productTypeSlug ?? 'outros')))
  const filtered = activeFilter === 'todos' ? products : products.filter((p) => (p.productTypeSlug ?? 'outros') === activeFilter)

  const tabClass = (active: boolean) =>
    cn(
      'rounded-full border px-[18px] py-2.5 text-[13px] font-medium transition-all',
      active
        ? 'border-surface-foreground bg-surface-foreground text-surface'
        : 'border-surface-foreground/12 text-surface-foreground/62 hover:text-surface-foreground',
    )

  return (
    <section id="produtos" className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-8">
        <div className="mb-12 flex items-end justify-between gap-12 max-lg:flex-col max-lg:items-start">
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-surface-foreground/20 bg-surface-foreground/[0.04] px-3.5 py-2 text-[11px] font-medium uppercase tracking-[.22em] text-surface-foreground/60">
              <span className="h-1.5 w-1.5 rounded-full bg-surface-foreground/40" />
              Catálogo de crédito
            </span>
            <h2 className="mt-[18px] text-[54px] font-light leading-none tracking-tight text-surface-foreground max-lg:text-5xl max-sm:text-4xl">
              Produtos de empréstimo<br />
              <em className="font-serif not-italic font-normal text-[oklch(0.48_0.07_50)]">desenhados para sua jornada.</em>
            </h2>
          </div>
          {/* TODO: [White-label] descrição configurável */}
          <p className="max-w-[420px] text-[15px] leading-relaxed text-surface-foreground/62">
            Linhas distintas, do consignado ao home equity. Toque em qualquer produto para simular e ver sua parcela em tempo real.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2.5">
          <button type="button" onClick={() => setActiveFilter('todos')} className={tabClass(activeFilter === 'todos')}>
            Todos os produtos <span className={cn('ml-2 text-[11px]', activeFilter === 'todos' ? 'opacity-50' : 'opacity-40')}>{products.length}</span>
          </button>
          {types.map((type) => (
            <button key={type} type="button" onClick={() => setActiveFilter(type)} className={tabClass(activeFilter === type)}>
              {TYPE_LABELS[type] ?? type}
              <span className={cn('ml-2 text-[11px]', activeFilter === type ? 'opacity-50' : 'opacity-40')}>
                {products.filter((p) => (p.productTypeSlug ?? 'outros') === type).length}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-surface-foreground/50">Nenhum produto disponível no momento.</p>
        ) : (
          <div className="grid grid-cols-3 gap-[18px] max-lg:grid-cols-2 max-sm:grid-cols-1">
            {filtered.map((p, index) => (
              <div key={p.id} className={cn(index === 0 && filtered.length > 1 ? 'row-span-2 max-lg:row-span-1' : '')}>
                <ProductCard {...p} featured={index === 0 && filtered.length > 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 8.2: Commit**
```bash
git add apps/store/src/app/(store)/_components/products-section.tsx
git commit -m "feat(store): ProductsSection Client com filter tabs"
```

---

## Task 9: HowItWorks + CtaBanner

**Files:**
- Create: `apps/store/src/app/(store)/_components/how-it-works.tsx`
- Create: `apps/store/src/app/(store)/_components/cta-banner.tsx`

- [ ] **Step 9.1: Criar how-it-works.tsx**

```typescript
// TODO: [White-label] steps configuráveis por tenant (JSON/DB)
const STEPS = [
  { n: 'I', title: 'Simule o crédito', description: 'Escolha o produto e ajuste valor e prazo em tempo real. Veja sua parcela na hora.' },
  { n: 'II', title: 'Preencha os dados', description: 'Formulário digital rápido. Sem papelada, sem filas, sem agência.' },
  { n: 'III', title: 'Análise instantânea', description: 'Sua proposta é analisada em minutos. Você recebe uma resposta pelo e-mail.' },
  { n: 'IV', title: 'Crédito aprovado', description: 'Assine digitalmente e acompanhe pelo painel. Dinheiro disponível em até 24 horas.' },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-t border-primary/[0.08] bg-background py-24">
      <div className="mx-auto max-w-7xl px-8">
        <div className="mb-14 flex items-end justify-between gap-12 max-lg:flex-col max-lg:items-start">
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/28 bg-primary/[0.04] px-3.5 py-2 text-[11px] font-medium uppercase tracking-[.22em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Como funciona
            </span>
            <h2 className="mt-[18px] text-[54px] font-light leading-none tracking-tight text-foreground max-lg:text-5xl max-sm:text-4xl">
              Quatro passos para o<br />
              <em className="font-serif not-italic font-normal text-primary">crédito na sua mão.</em>
            </h2>
          </div>
          <p className="max-w-[420px] text-[15px] leading-relaxed text-foreground/62">
            Processo 100% digital, sem agência, sem fila. Você acompanha cada etapa em tempo real.
          </p>
        </div>

        <div className="relative grid grid-cols-4 gap-8 max-lg:grid-cols-2">
          <div
            className="pointer-events-none absolute left-[60px] right-[60px] top-[30px] hidden h-px lg:block"
            style={{ background: 'repeating-linear-gradient(90deg, oklch(0.83 0.10 85 / 0.30) 0 6px, transparent 6px 14px)' }}
            aria-hidden="true"
          />
          {STEPS.map((step) => (
            <div key={step.n} className="relative">
              <div className="relative z-10 mb-6 grid h-[60px] w-[60px] place-items-center rounded-full border border-primary/30 bg-background font-serif italic text-[26px] text-primary">
                {step.n}
              </div>
              <h4 className="mb-2 text-lg font-semibold leading-tight tracking-tight text-foreground">{step.title}</h4>
              <p className="text-[13px] leading-relaxed text-foreground/62">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 9.2: Criar cta-banner.tsx**

```typescript
import Link from 'next/link'

type Props = { featuredProductId: string | null }

export function CtaBanner({ featuredProductId }: Props) {
  return (
    <section className="relative overflow-hidden bg-surface py-20">
      <div className="mx-auto max-w-7xl px-8">
        <div className="grid grid-cols-[1.2fr_1fr] items-center gap-16 max-lg:grid-cols-1">
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-surface-foreground/20 bg-surface-foreground/[0.04] px-3.5 py-2 text-[11px] font-medium uppercase tracking-[.22em] text-surface-foreground/60">
              <span className="h-1.5 w-1.5 rounded-full bg-surface-foreground/40" />
              Pronto para começar
            </span>
            {/* TODO: [White-label] copy configurável */}
            <h2 className="mb-5 mt-[18px] text-[56px] font-light leading-none tracking-tight text-surface-foreground max-lg:text-5xl max-sm:text-4xl">
              Simule sem<br />
              <em className="font-serif not-italic font-normal text-[oklch(0.48_0.07_50)]">compromisso.</em>
            </h2>
            <p className="mb-8 max-w-[480px] text-base leading-relaxed text-surface-foreground/62">
              Veja exatamente quanto você vai pagar, em quantas parcelas e com qual taxa — antes de qualquer assinatura. Não afeta seu score.
            </p>
            <div className="flex gap-3.5">
              {featuredProductId && (
                <Link href={`/produto/${featuredProductId}`} className="rounded-full bg-surface-foreground px-[26px] py-3.5 text-sm font-semibold text-surface transition-all hover:opacity-90">
                  Iniciar simulação
                </Link>
              )}
              <Link href="#" className="rounded-full border border-surface-foreground/18 px-[26px] py-3.5 text-sm font-medium text-surface-foreground transition-all hover:border-surface-foreground">
                Falar com consultor
              </Link>
            </div>
          </div>

          {/* TODO: [White-label] depoimento configurável */}
          <div className="relative rounded-[20px] border border-black/[0.06] bg-white p-8">
            <span className="absolute -top-2.5 left-6 font-serif text-[90px] leading-none text-primary" aria-hidden="true">&ldquo;</span>
            <blockquote className="mt-6 font-serif italic text-[17px] leading-relaxed text-surface-foreground">
              O atendimento me trouxe a primeira linha de crédito que respeitou meu tempo e minha história. Aprovado em 4 horas, sem constrangimento.
            </blockquote>
            <div className="mt-6 flex items-center gap-3.5">
              <div className="grid h-[46px] w-[46px] flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-[oklch(0.48_0.07_50)] to-[oklch(0.25_0.04_45)] text-base font-semibold text-surface">MR</div>
              <div>
                <div className="text-sm font-semibold text-surface-foreground">Marcus R., 47</div>
                <div className="text-xs text-surface-foreground/55">Consignado INSS · R$ 28.000</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 9.3: Commit**
```bash
git add apps/store/src/app/(store)/_components/how-it-works.tsx apps/store/src/app/(store)/_components/cta-banner.tsx
git commit -m "feat(store): HowItWorks + CtaBanner estilo ZP Pay"
```

---

## Task 10: Home page assembly

**Files:**
- Modify: `apps/store/src/app/(store)/page.tsx`
- Delete: `apps/store/src/app/(store)/_components/value-props.tsx`

- [ ] **Step 10.1: Reescrever page.tsx**

Antes de escrever, ler `apps/store/src/app/(store)/queries.ts` para verificar o shape exato do retorno de `listActiveProducts` (especialmente `product_type`).

```typescript
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getTenantBranding } from '@/lib/branding'
import { listActiveProducts } from './queries'
import { HeroSection } from './_components/hero-section'
import { ProductStrip } from './_components/product-strip'
import { ProductsSection } from './_components/products-section'
import { HowItWorks } from './_components/how-it-works'
import { CtaBanner } from './_components/cta-banner'

export const metadata: Metadata = { title: 'Início' }

export default async function HomePage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id') ?? ''

  const [branding, products] = await Promise.all([
    getTenantBranding(tenantId),
    listActiveProducts(tenantId),
  ])

  const validProducts = products.filter((tp) => tp.products != null)
  const featuredProduct = validProducts[0] ?? null
  const featuredProductId = featuredProduct?.id ?? null
  const minRate = featuredProduct?.products?.min_rate_monthly ?? null

  const productList = validProducts.map((tp) => ({
    id: tp.id,
    coverUrl: tp.cover_url ?? null,
    productName: tp.products!.name,
    productTypeSlug: (tp.products!.product_type as { slug: string } | null)?.slug ?? null,
    minAmount: tp.products!.min_amount ?? null,
    maxAmount: tp.products!.max_amount ?? null,
    minTermMonths: tp.products!.min_term_months ?? null,
    maxTermMonths: tp.products!.max_term_months ?? null,
  }))

  const chipList = productList.map((p) => ({
    id: p.id,
    typeSlug: p.productTypeSlug ?? 'outros',
    rate: p.minAmount != null ? minRate : null,
  }))

  return (
    <>
      <HeroSection
        displayName={branding?.company_display_name ?? null}
        featuredProductId={featuredProductId}
        minRate={minRate}
      />
      <ProductStrip products={chipList} />
      <ProductsSection products={productList} />
      <HowItWorks />
      <CtaBanner featuredProductId={featuredProductId} />
    </>
  )
}
```

- [ ] **Step 10.2: Deletar value-props.tsx**
```bash
git rm apps/store/src/app/(store)/_components/value-props.tsx
```

- [ ] **Step 10.3: Commit**
```bash
git add apps/store/src/app/(store)/page.tsx
git commit -m "feat(store): home page — 5 seções ZP Pay assembladas"
```

---

## Task 11: Simulador — layout split + SimulatorPanel com PMT

**Files:**
- Modify: `apps/store/src/app/(store)/produto/[id]/page.tsx`
- Modify: `apps/store/src/app/(store)/produto/[id]/_components/simulator-panel.tsx`

- [ ] **Step 11.1: Reescrever simulator page.tsx**

Antes de escrever, ler o arquivo atual para confirmar imports e shape de `tp.products` (especialmente `product_type` e `description`).

```typescript
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Zap, Lock, Shield } from 'lucide-react'
import { generateTermOptions } from '@/lib/utils/simulator'
import { getTenantProduct } from '../../queries'
import { SimulatorPanel } from './_components/simulator-panel'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ amount?: string; term?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const tp = await getTenantProduct(id, tenantId)
  return { title: tp?.products?.name ?? 'Simulador' }
}

export default async function SimulatorPage({ params, searchParams }: Props) {
  const { id } = await params
  const { amount: amountParam, term: termParam } = await searchParams
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const tp = await getTenantProduct(id, tenantId)
  if (!tp || !tp.products) notFound()

  const { products: p } = tp
  const minAmount = p.min_amount ?? 1000
  const maxAmount = p.max_amount ?? 100000
  const minTerm = p.min_term_months ?? 12
  const maxTerm = p.max_term_months ?? 60
  const minRate = p.min_rate_monthly ?? 0
  const termOptions = generateTermOptions(minTerm, maxTerm)
  const initialAmount = Math.min(maxAmount, Math.max(minAmount, Number(amountParam) || minAmount))
  const initialTerm = termOptions.includes(Number(termParam)) ? Number(termParam) : termOptions[0]
  const categoryLabel = (p.product_type as { name: string } | null)?.name ?? 'Crédito'

  return (
    <div className="grid min-h-[calc(100vh-78px)] grid-cols-[5fr_7fr] max-lg:grid-cols-1">
      {/* Esquerda dark */}
      <div className="flex flex-col justify-between bg-background px-14 py-16 max-lg:px-8 max-lg:py-10">
        <div>
          <Link href="/#produtos" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar aos produtos
          </Link>
          <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/28 bg-primary/[0.04] px-3.5 py-2 text-[11px] font-medium uppercase tracking-[.22em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {categoryLabel} · {p.name}
          </span>
          <h2 className="mb-[22px] mt-6 text-[56px] font-light leading-none tracking-tight text-foreground max-lg:text-5xl max-sm:text-4xl">
            Simule seu<br />
            <em className="font-serif not-italic font-normal text-primary">
              {p.name.split(' ').slice(-1)[0]?.toLowerCase() ?? 'crédito'}.
            </em>
          </h2>
          <p className="max-w-[380px] text-[15px] leading-relaxed text-foreground/70">
            {p.description ?? 'Ajuste valor e prazo para ver sua parcela em tempo real. Tudo transparente.'}
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-[18px]">
          {[
            { Icon: Zap, title: 'Aprovação em minutos', desc: 'Engine de crédito digital com resposta rápida.' },
            { Icon: Lock, title: 'Taxa garantida por 30 dias', desc: 'Simulou hoje? A taxa fica garantida durante a contratação.' },
            { Icon: Shield, title: 'Sem afetar seu score', desc: 'Consulta soft, sem registro em birôs de crédito.' },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="flex gap-3.5">
              <div className="grid h-[38px] w-[38px] flex-shrink-0 place-items-center rounded-[10px] bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{title}</div>
                <div className="text-xs leading-relaxed text-foreground/55">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Direita surface */}
      <div className="bg-surface px-14 py-16 text-surface-foreground max-lg:px-8 max-lg:py-10">
        <div className="mb-9 flex items-center justify-between">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-[oklch(0.48_0.07_50)/30] bg-[oklch(0.48_0.07_50)/4] px-3.5 py-2 text-[11px] font-medium uppercase tracking-[.22em] text-[oklch(0.48_0.07_50)]">
            <span className="h-1.5 w-1.5 rounded-full bg-green-700" /> Simulação
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-7 rounded-full bg-primary" />
            <span className="h-1 w-7 rounded-full bg-surface-foreground/12" />
            <span className="h-1 w-7 rounded-full bg-surface-foreground/12" />
            <span className="ml-2 text-[11px] uppercase tracking-[.18em] text-surface-foreground/50">Etapa 1 de 3</span>
          </div>
        </div>

        <h2 className="mb-1.5 text-[38px] font-semibold leading-none tracking-tight">Configure sua linha</h2>
        <p className="mb-9 font-serif italic text-[15px] text-surface-foreground/55">
          Os valores se atualizam automaticamente — você está no controle.
        </p>

        <SimulatorPanel
          tenantProductId={id}
          minAmount={minAmount}
          maxAmount={maxAmount}
          termOptions={termOptions}
          minRate={minRate}
          initialAmount={initialAmount}
          initialTerm={initialTerm}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 11.2: Reescrever simulator-panel.tsx com PMT**

```typescript
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatCurrency, calcPMT, calcCETAnual } from '@/lib/utils/simulator'

type Props = {
  tenantProductId: string
  minAmount: number
  maxAmount: number
  termOptions: number[]
  minRate: number
  initialAmount: number
  initialTerm: number
}

export function SimulatorPanel({ tenantProductId, minAmount, maxAmount, termOptions, minRate, initialAmount, initialTerm }: Props) {
  const router = useRouter()
  const [amount, setAmount] = useState(initialAmount)
  const [term, setTerm] = useState(initialTerm)

  const installment = useMemo(() => calcPMT(amount, minRate, term), [amount, minRate, term])
  const total = installment * term
  const cet = useMemo(() => calcCETAnual(minRate), [minRate])

  return (
    <div className="space-y-9">
      {/* Slider de valor */}
      <div>
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[.02em] text-surface-foreground">Valor do empréstimo</span>
          <span className="text-lg font-semibold text-primary">{formatCurrency(amount)}</span>
        </div>
        <input
          type="range"
          min={minAmount}
          max={maxAmount}
          step={500}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-surface-foreground/12 accent-primary outline-none"
        />
        <div className="mt-2.5 flex justify-between text-[11px] uppercase tracking-[.16em] text-surface-foreground/50">
          <span>{formatCurrency(minAmount)}</span><span>{formatCurrency(maxAmount)}</span>
        </div>
      </div>

      {/* Prazo */}
      <div>
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[.02em] text-surface-foreground">Prazo de pagamento</span>
          <span className="text-lg font-semibold text-primary">{term} meses</span>
        </div>
        <div className={cn('grid gap-2', termOptions.length <= 4 ? 'grid-cols-4' : 'grid-cols-5')}>
          {termOptions.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTerm(t)}
              className={cn(
                'rounded-[10px] border py-3.5 text-sm font-semibold transition-all',
                term === t
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-surface-foreground/10 bg-white text-surface-foreground hover:border-[oklch(0.48_0.07_50)]',
              )}
            >
              {t % 12 === 0 ? `${t / 12}a` : `${t}m`}
            </button>
          ))}
        </div>
      </div>

      {/* Resultado */}
      <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-6 rounded-[18px] bg-background px-7 py-6 text-foreground max-sm:grid-cols-1">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[.2em] text-foreground/50">Parcela mensal</div>
          <div className="mt-1 text-[28px] font-semibold leading-none tracking-tight">{formatCurrency(installment)}</div>
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[.2em] text-foreground/50">CET anual</div>
          <div className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-green-400">
            {cet.toFixed(2).replace('.', ',')}%
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/solicitar/${tenantProductId}?amount=${amount}&term=${term}`)}
          className="whitespace-nowrap rounded-full bg-gradient-to-b from-primary to-primary/80 px-[22px] py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-10px_oklch(0.83_0.10_85/50%)] transition-all hover:brightness-110"
        >
          Continuar →
        </button>
      </div>

      <p className="text-center text-[11px] leading-relaxed text-surface-foreground/50">
        Total estimado: <strong className="text-surface-foreground/70">{formatCurrency(total)}</strong>
        {' '}· Taxa a partir de <strong className="text-surface-foreground/70">{minRate.toFixed(2).replace('.', ',')}% a.m.</strong>
        {' '}· Esta consulta não afeta seu score.
      </p>
    </div>
  )
}
```

- [ ] **Step 11.3: Commit**
```bash
git add apps/store/src/app/(store)/produto/[id]/page.tsx apps/store/src/app/(store)/produto/[id]/_components/simulator-panel.tsx
git commit -m "feat(store): simulador split layout + PMT + visual ZP Pay"
```

---

## Task 12: Formulário — page layout + StepIndicator + StepOneForm

**Files:**
- Modify: `apps/store/src/app/(store)/solicitar/[id]/page.tsx`
- Modify: `apps/store/src/app/(store)/solicitar/[id]/_components/step-indicator.tsx`
- Modify: `apps/store/src/app/(store)/solicitar/[id]/_components/step-one-form.tsx`

- [ ] **Step 12.1: Ler step-indicator.tsx atual para confirmar interface**

- [ ] **Step 12.2: Reescrever step-indicator.tsx**

A prop `currentStep` (1 | 2) representa o passo do formulário. O fluxo total tem 3 etapas (simulação + form step 1 + form step 2), então step=1 → "Etapa 2 de 3", step=2 → "Etapa 3 de 3".

```typescript
import { cn } from '@/lib/utils'

type Props = { currentStep: 1 | 2 }

export function StepIndicator({ currentStep }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-1 w-7 rounded-full bg-surface-foreground/40" />
      <span className={cn('h-1 w-7 rounded-full', currentStep === 1 ? 'bg-primary' : 'bg-surface-foreground/40')} />
      <span className={cn('h-1 w-7 rounded-full', currentStep === 2 ? 'bg-primary' : 'bg-surface-foreground/12')} />
      <span className="ml-2 text-[11px] uppercase tracking-[.18em] text-surface-foreground/50">
        Etapa {currentStep + 1} de 3
      </span>
    </div>
  )
}
```

- [ ] **Step 12.3: Reescrever solicitar page.tsx**

Antes de escrever, confirmar o shape de `tp.products.product_type` lendo queries.ts.

```typescript
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTenantProduct } from '../../queries'
import { createProposal } from './actions'
import { StepIndicator } from './_components/step-indicator'
import { StepOneForm } from './_components/step-one-form'
import { StepTwoForm } from './_components/step-two-form'
import { formatCurrency } from '@/lib/utils/simulator'

export const metadata: Metadata = { title: 'Solicitar crédito' }

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ step?: string; purpose?: string; amount?: string; term?: string; name?: string; email?: string }>
}

export default async function RequestPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = await searchParams
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const tp = await getTenantProduct(id, tenantId)
  if (!tp || !tp.products) notFound()

  const step = sp.step === '2' ? 2 : 1
  const minRate = tp.products.min_rate_monthly ?? 0
  const initialAmount = Number(sp.amount) || tp.products.min_amount || 1000
  const initialTerm = Number(sp.term) || tp.products.min_term_months || 12
  const boundAction = createProposal.bind(null, id, tp.products.id)
  const step1Data = { purpose: sp.purpose ?? '', amount: sp.amount ?? String(initialAmount), term: sp.term ?? String(initialTerm), name: sp.name ?? '', email: sp.email ?? '' }
  const rateStr = minRate.toFixed(2).replace('.', ',')
  const categoryName = (tp.products.product_type as { name: string } | null)?.name ?? 'Produto'

  return (
    <div className="min-h-[calc(100vh-78px)] bg-surface py-12 text-surface-foreground">
      <div className="mx-auto max-w-7xl px-8">
        <Link href={`/produto/${id}`} className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-[oklch(0.48_0.07_50)] transition-colors hover:text-surface-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar à simulação
        </Link>

        <div className="mb-8 flex items-end justify-between max-sm:flex-col max-sm:items-start max-sm:gap-4">
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-[oklch(0.48_0.07_50)/20] bg-[oklch(0.48_0.07_50)/4] px-3.5 py-2 text-[11px] font-medium uppercase tracking-[.22em] text-[oklch(0.48_0.07_50)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.48_0.07_50)]" />
              Etapa {step + 1} de 3 · Solicitação
            </span>
            <h2 className="mt-3.5 text-[54px] font-light leading-none tracking-tight max-sm:text-4xl">
              Quase lá<em className="font-serif not-italic font-normal text-[oklch(0.48_0.07_50)]">.</em>
            </h2>
          </div>
          <StepIndicator currentStep={step as 1 | 2} />
        </div>

        <div className="grid grid-cols-[1fr_380px] gap-12 max-lg:grid-cols-1">
          {/* Card principal */}
          <div className="rounded-[22px] border border-black/[0.06] bg-white p-12 max-sm:p-6">
            {step === 1 ? (
              <StepOneForm tenantProductId={id} minRate={minRate} initialAmount={initialAmount} initialTerm={initialTerm} />
            ) : (
              <StepTwoForm tenantProductId={id} action={boundAction} step1Data={step1Data} />
            )}
          </div>

          {/* Aside sticky */}
          <aside className="flex flex-col gap-3.5 max-lg:order-first">
            <div className="relative overflow-hidden rounded-[20px] bg-card p-7 text-foreground">
              <div className="pointer-events-none absolute -right-20 -top-20 h-[200px] w-[200px] rounded-full"
                style={{ background: 'radial-gradient(circle, oklch(0.83 0.10 85 / 0.16), transparent 70%)' }}
                aria-hidden="true" />
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/28 bg-primary/[0.06] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[.18em] text-primary">
                <span className="h-1 w-1 rounded-full bg-green-400" /> Resumo
              </span>
              <h4 className="mt-[18px] text-[22px] font-semibold leading-tight tracking-tight">{tp.products.name}</h4>
              <p className="mb-6 mt-1 text-sm text-foreground/60">{categoryName} · taxa a partir de {rateStr}%</p>
              {[
                { k: 'Valor solicitado', v: formatCurrency(initialAmount) },
                { k: 'Prazo', v: `${initialTerm} meses` },
                { k: 'Taxa a partir de', v: `${rateStr}% a.m.` },
              ].map(({ k, v }) => (
                <div key={k} className="flex justify-between border-t border-primary/12 py-3 text-sm">
                  <span className="text-foreground/55">{k}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </div>

            {[
              { title: 'Precisa de ajuda?', desc: 'Nossa equipe atende de seg a sáb, 8h–20h.', link: 'Falar agora →' },
              { title: 'Conexão protegida', desc: 'Criptografia AES-256. Seus dados protegidos.' },
            ].map(({ title, desc, link }) => (
              <div key={title} className="flex gap-3.5 rounded-[18px] border border-black/[0.06] bg-white p-[22px]">
                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-[10px] bg-surface text-[oklch(0.25_0.04_45)]">
                  {link ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-surface-foreground">{title}</div>
                  <div className="mt-1 text-xs leading-relaxed text-surface-foreground/55">{desc}</div>
                  {link && <a href="#" className="mt-2 inline-block text-xs font-semibold text-[oklch(0.25_0.04_45)]">{link}</a>}
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 12.4: Reescrever step-one-form.tsx (lógica idêntica, visual ZP Pay)**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatRate } from '@/lib/utils/simulator'

const PURPOSE_OPTIONS = [
  { value: 'pessoal', label: 'Uso pessoal' },
  { value: 'empresa', label: 'Empresa / negócio' },
  { value: 'imovel', label: 'Imóvel' },
  { value: 'veiculo', label: 'Veículo' },
  { value: 'outro', label: 'Outro' },
]

type Props = { tenantProductId: string; minRate: number; initialAmount: number; initialTerm: number }
type FormErrors = Record<string, string>

const fieldCls = 'w-full border-b border-b-black/18 bg-transparent pb-2.5 pt-2 text-base text-surface-foreground outline-none transition-colors placeholder:text-surface-foreground/30 focus:border-b-[oklch(0.25_0.04_45)]'
const labelCls = 'text-xs font-semibold tracking-[.02em] text-surface-foreground'

export function StepOneForm({ tenantProductId, minRate, initialAmount, initialTerm }: Props) {
  const router = useRouter()
  const [purpose, setPurpose] = useState('')
  const [amount, setAmount] = useState(String(initialAmount))
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [term, setTerm] = useState(String(initialTerm))
  const [errors, setErrors] = useState<FormErrors>({})

  function validate(): boolean {
    const errs: FormErrors = {}
    if (!purpose) errs.purpose = 'Selecione uma finalidade'
    if (!amount || Number(amount) <= 0) errs.amount = 'Informe um valor válido'
    if (!name || name.trim().length < 3) errs.name = 'Nome deve ter ao menos 3 caracteres'
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'E-mail inválido'
    if (!term) errs.term = 'Informe o prazo'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleContinue() {
    if (!validate()) return
    const params = new URLSearchParams({ step: '2', purpose, amount, term, name: name.trim(), email: email.trim() })
    router.push(`/solicitar/${tenantProductId}?${params.toString()}`)
  }

  return (
    <div>
      <div className="mb-9">
        <h3 className="mb-1 text-lg font-semibold tracking-tight text-surface-foreground">Dados da simulação</h3>
        <p className="text-sm text-surface-foreground/55">Informe os detalhes do crédito que você precisa.</p>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-7 max-sm:grid-cols-1">
        <div className="col-span-2 flex flex-col gap-2.5 max-sm:col-span-1">
          <span className={labelCls}>Finalidade do crédito</span>
          <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className={`${fieldCls} cursor-pointer`}>
            <option value="" disabled>Selecione...</option>
            {PURPOSE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {errors.purpose && <p className="text-xs text-destructive">{errors.purpose}</p>}
        </div>

        <div className="flex flex-col gap-2.5">
          <span className={labelCls}>Valor desejado</span>
          <div className="flex items-center border-b border-b-black/18 pb-2.5 pt-2 transition-colors focus-within:border-b-[oklch(0.25_0.04_45)]">
            <span className="mr-1.5 text-base text-surface-foreground/45">R$</span>
            <input type="number" min={0} step={100} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50.000" className="flex-1 bg-transparent text-base text-surface-foreground outline-none placeholder:text-surface-foreground/30" />
          </div>
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
        </div>

        <div className="flex flex-col gap-2.5">
          <span className={labelCls}>Prazo (meses)</span>
          <input type="number" min={1} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="36" className={fieldCls} />
          {errors.term && <p className="text-xs text-destructive">{errors.term}</p>}
        </div>

        <div className="flex flex-col gap-2.5">
          <span className={labelCls}>Nome completo</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" className={fieldCls} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="flex flex-col gap-2.5">
          <span className={labelCls}>E-mail</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className={fieldCls} />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
      </div>

      <div className="mt-10 border-l-2 border-primary/50 pl-4 text-sm text-surface-foreground/55">
        Taxa a partir de <strong className="text-surface-foreground">{formatRate(minRate)}% a.m.</strong>
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-black/[0.08] pt-8">
        <button type="button" onClick={() => router.back()} className="rounded-full border border-surface-foreground/18 px-[26px] py-3.5 text-sm font-medium text-surface-foreground transition-all hover:border-surface-foreground">
          Voltar
        </button>
        <button type="button" onClick={handleContinue} className="rounded-full bg-surface-foreground px-[26px] py-3.5 text-sm font-semibold text-surface transition-all hover:opacity-90">
          Continuar →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 12.5: Commit**
```bash
git add apps/store/src/app/(store)/solicitar/[id]/page.tsx apps/store/src/app/(store)/solicitar/[id]/_components/step-indicator.tsx apps/store/src/app/(store)/solicitar/[id]/_components/step-one-form.tsx
git commit -m "feat(store): formulário layout + StepIndicator + StepOneForm ZP Pay"
```

---

## Task 13: StepTwoForm visual redesign

**Files:**
- Modify: `apps/store/src/app/(store)/solicitar/[id]/_components/step-two-form.tsx`

Toda lógica (useActionState, CEP lookup via /api/cep, InputMask, hidden inputs) permanece idêntica. Apenas substituir visual shadcn por classes ZP Pay.

- [ ] **Step 13.1: Ler o arquivo atual e reescrever apenas as classes CSS**

Aplicar nos inputs as classes:
```
fieldCls = 'w-full border-b border-b-black/18 bg-transparent pb-2.5 pt-2 text-base text-surface-foreground outline-none transition-colors placeholder:text-surface-foreground/30 focus:border-b-[oklch(0.25_0.04_45)]'
labelCls = 'text-xs font-semibold tracking-[.02em] text-surface-foreground'
```

Para cada campo, trocar a estrutura `<div className="space-y-1.5"><Label>...</Label><Input .../></div>` por:
```tsx
<div className="flex flex-col gap-2.5">
  <span className={labelCls}>Nome do campo</span>
  <InputMask ... className={fieldCls} />  {/* ou input/Input */}
  {error && <p className="text-xs text-destructive">{error}</p>}
</div>
```

Grid de campos: `grid grid-cols-2 gap-x-6 gap-y-7 max-sm:grid-cols-1`

Seção de endereço separada por: `<div className="mt-9 border-t border-black/[0.08] pt-9">`

Botões de rodapé:
```tsx
<div className="mt-10 flex items-center justify-between border-t border-black/[0.08] pt-8">
  <button type="button" onClick={...} className="rounded-full border border-surface-foreground/18 px-[26px] py-3.5 text-sm font-medium text-surface-foreground transition-all hover:border-surface-foreground">
    Voltar
  </button>
  <button type="submit" disabled={isPending} className="rounded-full bg-surface-foreground px-[26px] py-3.5 text-sm font-semibold text-surface transition-all hover:opacity-90 disabled:opacity-50">
    {isPending ? 'Enviando...' : 'Enviar solicitação →'}
  </button>
</div>
```

Manter todos os hidden inputs, todas as validações, e o cep lookup inalterados.

- [ ] **Step 13.2: Commit**
```bash
git add apps/store/src/app/(store)/solicitar/[id]/_components/step-two-form.tsx
git commit -m "feat(store): StepTwoForm visual ZP Pay, lógica inalterada"
```

---

## Task 14: Confirmação redesign

**Files:**
- Modify: `apps/store/src/app/(store)/confirmacao/[id]/page.tsx`

- [ ] **Step 14.1: Reescrever confirmacao page.tsx**

```typescript
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/simulator'
import { getProposalConfirmation } from '../../queries'

export const metadata: Metadata = { title: 'Solicitação recebida' }

type Props = { params: Promise<{ id: string }> }

export default async function ConfirmationPage({ params }: Props) {
  const { id } = await params
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const proposal = await getProposalConfirmation(id, tenantId)
  if (!proposal) notFound()

  const protocol = proposal.id.replace(/-/g, '').slice(0, 8).toUpperCase()
  // biome-ignore lint/suspicious/noExplicitAny: supabase join type
  const productName = (proposal.products as any)?.name ?? ''

  return (
    <div className="relative grid min-h-[calc(100vh-78px)] place-items-center overflow-hidden bg-background px-8 py-16">
      <div
        className="pointer-events-none absolute -right-[300px] -top-[200px] h-[800px] w-[800px] rounded-full"
        style={{ background: 'radial-gradient(circle, oklch(0.83 0.10 85 / 0.08), transparent 60%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[680px] text-center">
        <div className="mx-auto mb-9 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-b from-primary to-primary/70 shadow-[0_30px_80px_-20px_oklch(0.83_0.10_85/40%)] text-primary-foreground">
          <Check className="h-10 w-10" strokeWidth={2.5} />
        </div>

        <h1 className="mb-5 text-[60px] font-light leading-none tracking-tight text-foreground max-sm:text-[38px]">
          Solicitação<br />
          <em className="font-serif not-italic font-normal text-primary">recebida.</em>
        </h1>

        <p className="mx-auto mb-10 max-w-[480px] text-[17px] leading-relaxed text-foreground/70">
          Recebemos sua solicitação para{' '}
          <strong className="text-primary">{productName}</strong>.
          Nossa equipe entrará em contato pelo e-mail cadastrado em breve.
        </p>

        <div className="mb-9 grid grid-cols-3 gap-3.5 rounded-[18px] border border-primary/12 bg-foreground/[0.04] p-6 max-sm:grid-cols-1">
          {[
            { k: 'Protocolo', v: `#${protocol}` },
            { k: 'Valor solicitado', v: formatCurrency(proposal.desired_amount) },
            { k: 'Prazo', v: `${proposal.desired_term_months} meses` },
          ].map(({ k, v }) => (
            <div key={k}>
              <div className="text-[10px] font-medium uppercase tracking-[.2em] text-foreground/50">{k}</div>
              <div className="mt-1 text-lg font-semibold tracking-tight text-primary">{v}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-3.5">
          <Link
            href="/"
            className="rounded-full bg-gradient-to-b from-primary to-primary/80 px-[26px] py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-10px_oklch(0.83_0.10_85/50%)] transition-all hover:brightness-110"
          >
            Voltar ao início
          </Link>
          <Link
            href="/"
            className="rounded-full border border-foreground/18 px-[26px] py-3.5 text-sm font-medium text-foreground transition-all hover:border-primary hover:text-primary"
          >
            Nova simulação
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 14.2: Commit**
```bash
git add apps/store/src/app/(store)/confirmacao/[id]/page.tsx
git commit -m "feat(store): redesign tela de confirmação ZP Pay"
```

---

## Critérios de aceite finais

- [ ] Home renderiza com fundo dark e as 5 seções (Header, Hero, Products, HowItWorks, CtaBanner, Footer)
- [ ] Poppins como body font, Playfair Display nas headlines com `font-serif italic`
- [ ] Product strip deriva dos tipos de produtos reais do tenant
- [ ] Simulador: layout split tela cheia, PMT calculado com min_rate_monthly
- [ ] Formulário: layout com aside sticky, campos border-bottom only
- [ ] Confirmação: design dark centrado com protocolo em grid 3 colunas
- [ ] Todos os commits por task conforme definido
- [ ] `// TODO: [White-label]` presente em hero stats, floating cards, steps, depoimento, links de nav
