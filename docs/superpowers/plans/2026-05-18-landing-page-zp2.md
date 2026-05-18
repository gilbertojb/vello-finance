# Landing Page ZP2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o template `zp2` — landing page redesenhada da ZP Pay com seções alternadas claro/escuro, imagem no hero (no lugar dos cards flutuantes), FAQ em accordion, e seções novas (Benefícios, Parceiros, Proposta de Valor).

**Architecture:** Template isolado em `templates/zp2/`, sem compartilhamento de arquivos com `templates/zp/`. O template `zp` permanece inalterado. Registro em `templates/index.ts` com as mesmas funções `getTemplate` e `getHomeComponent`. Fontes Plus Jakarta Sans + Instrument Serif aplicadas via CSS variables no componente raiz do `Zp2Home`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4 (tokens CSS `bg-background`/`bg-surface`/`text-primary` etc.), shadcn/ui Accordion (a instalar), Lucide React, `next/font/google`, `next/image`.

---

## Estrutura de arquivos

```
apps/store/src/templates/zp2/
├── config.ts
├── home.tsx
└── _components/
    ├── header.tsx
    ├── footer.tsx
    ├── hero-section.tsx
    ├── benefits-section.tsx
    ├── partners-section.tsx
    ├── products-section.tsx
    ├── how-it-works.tsx
    ├── value-prop-section.tsx
    └── faq-section.tsx

apps/store/public/images/zp2/   ← diretório para imagens (criado neste plano)

apps/store/src/components/ui/accordion.tsx   ← componente shadcn a instalar
apps/store/src/templates/index.ts            ← modificar (adicionar zp2)
```

---

### Task 1: Instalar Accordion + criar estrutura de diretórios

**Files:**
- Create: `apps/store/src/components/ui/accordion.tsx` (via shadcn CLI)
- Create: `apps/store/src/templates/zp2/` (diretório)
- Create: `apps/store/public/images/zp2/` (diretório)

- [ ] **Step 1: Instalar o componente Accordion do shadcn/ui**

```bash
cd apps/store && npx shadcn@latest add accordion --yes
```

Resultado esperado: arquivo `src/components/ui/accordion.tsx` criado.

- [ ] **Step 2: Criar os diretórios**

```bash
mkdir -p apps/store/src/templates/zp2/_components
mkdir -p apps/store/public/images/zp2
```

- [ ] **Step 3: Criar arquivos de imagem placeholder**

```bash
# Cria um JPEG mínimo válido (1×1 px cinza) para cada imagem
node -e "
const fs = require('fs');
// JPEG 1x1 cinza médio (hex literal)
const px = Buffer.from(
  'ffd8ffe000104a46494600010100000100010000' +
  'ffdb004300100b0c0e0c0a100e0d0e1211101318' +
  '281a181616183123251d283a333d3c3933383740' +
  '48603e404857453738506d51575f626768673e4d' +
  '71797064785c656763ffc0000b080001000101011' +
  '100ffc4001f0000010501010101010100000000000' +
  '000000102030405060708090a0bffc4004b100001' +
  '0204030105000000000000000102030411051221' +
  '310641071322511461810723324252627282ffda' +
  '0008010100000502d97fffd9',
  'hex',
);
[
  \"apps/store/public/images/zp2/hero-bg.jpg\",
  \"apps/store/public/images/zp2/benefits-bg.jpg\",
  \"apps/store/public/images/zp2/how-it-works-bg.jpg\",
  \"apps/store/public/images/zp2/value-prop.jpg\",
].forEach(p => fs.writeFileSync(p, px));
console.log('Placeholders criados');
"
```

> **Nota:** Esses são placeholders de desenvolvimento. As imagens reais devem ser geradas com os prompts do Midjourney/DALL·E 3 descritos na spec (`docs/superpowers/specs/2026-05-18-landing-page-zp2-design.md`) e substituídas antes do deploy.

- [ ] **Step 4: Commit**

```bash
git add apps/store/src/components/ui/accordion.tsx apps/store/public/images/zp2/
git commit -m "feat(store): zp2 — instalar accordion shadcn e criar estrutura de diretórios"
```

---

### Task 2: config.ts

**Files:**
- Create: `apps/store/src/templates/zp2/config.ts`

- [ ] **Step 1: Criar o arquivo**

```typescript
// apps/store/src/templates/zp2/config.ts
import type { TemplateConfig } from '../_types'

export const zp2Template: TemplateConfig = {
  id: 'zp2',
  colors: {
    primary:    { l: 0.83, c: 0.10,  h: 85 },
    background: { l: 0.13, c: 0.015, h: 45 },
    surface:    { l: 0.97, c: 0.01,  h: 85 },
  },
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/store && npx tsc --noEmit 2>&1 | head -20
```

Resultado esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/templates/zp2/config.ts
git commit -m "feat(store): zp2 — config com cores do tema"
```

---

### Task 3: header.tsx

**Files:**
- Create: `apps/store/src/templates/zp2/_components/header.tsx`

- [ ] **Step 1: Criar o arquivo**

```tsx
// apps/store/src/templates/zp2/_components/header.tsx
'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  logoSlot:    ReactNode
  displayName: string | null
}

const NAV_LINKS = [
  { href: '#produtos',       label: 'Produtos' },
  { href: '#como-funciona',  label: 'Como funciona' },
  { href: '#faq',            label: 'FAQ' },
]

export function Zp2Header({ logoSlot, displayName }: Props) {
  const name = displayName ?? 'ZP Pay'
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-primary/8 bg-background/85 backdrop-blur-[14px]">
        <div className="mx-auto flex h-store-header max-w-7xl items-center gap-10 px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
          >
            {logoSlot ?? (
              <span className="text-xl font-bold tracking-tight text-foreground">{name}</span>
            )}
          </Link>

          <nav className="ml-auto hidden items-center gap-8 text-sm text-foreground/78 md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <Link
            href="#produtos"
            className="ml-auto rounded-full bg-linear-to-b from-primary to-primary/80 px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 md:ml-0"
          >
            Simular agora
          </Link>

          <button
            type="button"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-lg text-foreground/70 transition-colors hover:bg-foreground/6 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile nav overlay */}
      <div
        className={cn(
          'fixed inset-x-0 top-store-header z-40 border-b border-primary/8 bg-background/95 backdrop-blur-[14px] transition-all duration-200 md:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-8 py-4">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/6 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/store && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/templates/zp2/_components/header.tsx
git commit -m "feat(store): zp2 — Zp2Header com nav atualizada (FAQ)"
```

---

### Task 4: footer.tsx

**Files:**
- Create: `apps/store/src/templates/zp2/_components/footer.tsx`

- [ ] **Step 1: Criar o arquivo**

```tsx
// apps/store/src/templates/zp2/_components/footer.tsx
import Link from 'next/link'
import { TenantLogo } from '@/components/tenant-logo'

type Props = {
  logoUrl:     string | null
  displayName: string | null
}

export function Zp2Footer({ logoUrl, displayName }: Props) {
  const name = displayName ?? 'ZP Pay'
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-primary/8 bg-background py-12">
      <div className="mx-auto max-w-7xl px-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-foreground">
            {logoUrl ? (
              <TenantLogo url={logoUrl} alt={name} width={120} height={36} className="h-9 w-auto" />
            ) : (
              <span className="text-lg font-bold tracking-tight text-foreground">{name}</span>
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

- [ ] **Step 2: Commit**

```bash
git add apps/store/src/templates/zp2/_components/footer.tsx
git commit -m "feat(store): zp2 — Zp2Footer"
```

---

### Task 5: hero-section.tsx

**Files:**
- Create: `apps/store/src/templates/zp2/_components/hero-section.tsx`

- [ ] **Step 1: Criar o arquivo**

A coluna direita exibe `hero-bg.jpg` via `next/image` (substitui os cards flutuantes do ZP). Em mobile (`max-lg`) a coluna some; a seção mantém `bg-background` sólido.

```tsx
// apps/store/src/templates/zp2/_components/hero-section.tsx
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  displayName: string | null
}

export function HeroSection({ displayName }: Props) {
  const name = displayName ?? 'ZP Pay'

  return (
    <section className="relative overflow-hidden border-b border-primary/8 bg-background">
      <div className="mx-auto max-w-7xl px-8">
        <div className="grid grid-cols-[1.05fr_1fr] items-center gap-16 py-24 max-lg:grid-cols-1 max-lg:gap-12">

          {/* Coluna esquerda */}
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/28 bg-primary/4 px-3.5 py-2 text-xs font-medium uppercase tracking-[.22em] text-primary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
              </span>
              {name}
            </span>

            <h1 className="mb-5 mt-6 text-5xl font-light leading-none tracking-tighter max-sm:text-4xl">
              Precisa de crédito?{' '}
              <em className="font-serif text-6xl font-normal italic text-primary">
                Vamos te ajudar a encontrar o melhor caminho.
              </em>
            </h1>

            <p className="mb-9 max-w-lg text-base leading-relaxed text-foreground/74">
              Compare, simule e contrate com rapidez.
            </p>

            <div className="flex flex-col gap-2.5">
              <Link
                href="/simulador/pessoa-fisica"
                className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/6 px-6 py-4 text-sm font-semibold text-foreground/80 transition-all hover:border-primary/40 hover:bg-primary/10"
              >
                <span>Crédito Pessoa Física</span>
                <span className="text-foreground/40">→</span>
              </Link>
              <Link
                href="/simulador/pessoa-juridica"
                className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/6 px-6 py-4 text-sm font-semibold text-foreground/80 transition-all hover:border-primary/40 hover:bg-primary/10"
              >
                <span>Crédito Pessoa Jurídica</span>
                <span className="text-foreground/40">→</span>
              </Link>
              <Link
                href="/simulador/financiamentos"
                className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/6 px-6 py-4 text-sm font-semibold text-foreground/80 transition-all hover:border-primary/40 hover:bg-primary/10"
              >
                <span>Financiamentos</span>
                <span className="text-foreground/40">→</span>
              </Link>
              <Link
                href="/simulador"
                className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/18 px-6 py-4 text-sm font-semibold text-primary transition-all hover:bg-primary/25"
              >
                <span>Fazer Simulação Gratuita</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Coluna direita: imagem (oculta em mobile) */}
          <div className="relative h-hero-image overflow-hidden rounded-3xl border border-primary/12 max-lg:hidden">
            <Image
              src="/images/zp2/hero-bg.jpg"
              fill
              sizes="(max-width: 1280px) 50vw, 640px"
              className="object-cover object-top"
              priority
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
          </div>

        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/store && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/templates/zp2/_components/hero-section.tsx
git commit -m "feat(store): zp2 — HeroSection com imagem lateral"
```

---

### Task 6: benefits-section.tsx

**Files:**
- Create: `apps/store/src/templates/zp2/_components/benefits-section.tsx`

- [ ] **Step 1: Criar o arquivo**

```tsx
// apps/store/src/templates/zp2/_components/benefits-section.tsx
import Image from 'next/image'
import {
  ShieldCheck,
  Users,
  LayoutGrid,
  TrendingUp,
  CircleDollarSign,
} from 'lucide-react'

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'Processo simples e 100% online',
    description: 'Sem papelada, sem filas, sem agência. Tudo pelo celular ou computador.',
  },
  {
    icon: Users,
    title: 'Crédito para todos os perfis',
    description: 'Diferentes modalidades para diferentes momentos da sua vida financeira.',
  },
  {
    icon: LayoutGrid,
    title: 'Compare várias opções de uma vez',
    description: 'Receba múltiplas ofertas de instituições parceiras em um só lugar.',
  },
  {
    icon: TrendingUp,
    title: 'Aumenta suas chances de aprovação',
    description: 'Sua solicitação chega para as instituições mais compatíveis com o seu perfil.',
  },
  {
    icon: CircleDollarSign,
    title: 'Pode encontrar taxas melhores',
    description: 'A concorrência entre parceiros tende a gerar condições mais favoráveis para você.',
  },
]

export function BenefitsSection() {
  return (
    <section className="relative overflow-hidden bg-surface py-24">
      <Image
        src="/images/zp2/benefits-bg.jpg"
        fill
        sizes="100vw"
        className="object-cover"
        alt=""
      />
      <div className="absolute inset-0 bg-surface/80" />

      <div className="relative z-10 mx-auto max-w-7xl px-8">
        <span className="inline-flex items-center gap-2.5 rounded-full border border-surface-foreground/20 bg-surface-foreground/5 px-3.5 py-2 text-xs font-medium uppercase tracking-[.22em] text-surface-foreground/60">
          <span className="h-1.5 w-1.5 rounded-full bg-surface-foreground/40" />
          Por que a gente
        </span>

        <h2 className="mt-4 text-5xl font-light leading-none tracking-tight text-surface-foreground max-sm:text-4xl">
          Benefícios de contratar crédito{' '}
          <em className="font-serif italic font-normal text-accent-olive">
            com a gente
          </em>
        </h2>

        <div className="mt-12 grid grid-cols-3 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-surface-foreground/8 bg-surface/90 p-6"
            >
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-primary/8">
                <b.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold leading-tight text-surface-foreground">
                {b.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-surface-foreground/60">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/store/src/templates/zp2/_components/benefits-section.tsx
git commit -m "feat(store): zp2 — BenefitsSection (5 cards, bg com overlay)"
```

---

### Task 7: partners-section.tsx

**Files:**
- Create: `apps/store/src/templates/zp2/_components/partners-section.tsx`

- [ ] **Step 1: Criar o arquivo**

Logos são placeholders (texto). Quando os SVG/PNG dos parceiros estiverem disponíveis, substituir os `<div>` por `<Image>` com `object-contain`.

```tsx
// apps/store/src/templates/zp2/_components/partners-section.tsx
import Link from 'next/link'

const PARTNERS = ['Itaú', 'Bradesco', 'Santander', 'Creditas', 'CashMe']

export function PartnersSection() {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/28 bg-primary/4 px-3.5 py-2 text-xs font-medium uppercase tracking-[.22em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Parceiros
          </span>

          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-foreground/60">
            Parceiros de confiança, oferecendo as melhores condições para você.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {PARTNERS.map((partner) => (
              <div
                key={partner}
                className="flex h-9 items-center rounded-lg border border-foreground/8 bg-foreground/4 px-5 text-sm font-medium text-foreground/50"
              >
                {partner}
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/simulador"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
            >
              Simule seu crédito agora
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/store/src/templates/zp2/_components/partners-section.tsx
git commit -m "feat(store): zp2 — PartnersSection com logos placeholder"
```

---

### Task 8: products-section.tsx

**Files:**
- Create: `apps/store/src/templates/zp2/_components/products-section.tsx`

- [ ] **Step 1: Criar o arquivo**

Grid de 3 categorias estáticas com links para os simuladores. Copy conforme Google Doc (Sessão 4).

```tsx
// apps/store/src/templates/zp2/_components/products-section.tsx
import Link from 'next/link'
import { ArrowRight, User, Building2, Home } from 'lucide-react'

const CATEGORIES = [
  {
    icon: User,
    title: 'Crédito Pessoa Física',
    href: '/simulador/pessoa-fisica',
    items: ['Saque FGTS', 'Garantia de Imóvel', 'Garantia de Veículo'],
  },
  {
    icon: Building2,
    title: 'Crédito Pessoa Jurídica',
    href: '/simulador/pessoa-juridica',
    items: ['Capital de Giro', 'Antecipação de Recebíveis', 'Crédito com Garantia'],
  },
  {
    icon: Home,
    title: 'Financiamentos',
    href: '/simulador/financiamentos',
    items: ['Financiamento de Imóvel', 'Financiamento de Veículo'],
  },
]

export function ProductsSection() {
  return (
    <section id="produtos" className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-8">
        <span className="inline-flex items-center gap-2.5 rounded-full border border-surface-foreground/20 bg-surface-foreground/5 px-3.5 py-2 text-xs font-medium uppercase tracking-[.22em] text-surface-foreground/60">
          <span className="h-1.5 w-1.5 rounded-full bg-surface-foreground/40" />
          Catálogo de crédito
        </span>

        <h2 className="mt-4 text-5xl font-light leading-none tracking-tight text-surface-foreground max-sm:text-4xl">
          Soluções completas{' '}
          <em className="font-serif italic font-normal text-accent-olive">
            para cada perfil
          </em>
        </h2>

        <p className="mt-4 max-w-xl text-base leading-relaxed text-surface-foreground/60">
          Escolha o tipo de crédito que melhor se encaixa no seu momento.
        </p>

        <div className="mt-12 grid grid-cols-3 gap-4 max-lg:grid-cols-1">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.title}
              href={cat.href}
              className="group flex flex-col rounded-2xl border border-surface-foreground/12 bg-white p-8 transition-all hover:-translate-y-0.5 hover:border-surface-foreground/25 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-primary/8">
                <cat.icon className="h-6 w-6 text-primary" />
              </div>

              <h3 className="text-lg font-semibold leading-tight text-surface-foreground">
                {cat.title}
              </h3>

              <ul className="mt-4 flex flex-col gap-1.5">
                {cat.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-surface-foreground/60">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-primary/50" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-primary">
                Simular
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/simulador"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
          >
            Simular meu crédito
          </Link>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/store/src/templates/zp2/_components/products-section.tsx
git commit -m "feat(store): zp2 — ProductsSection (3 categorias estáticas)"
```

---

### Task 9: how-it-works.tsx

**Files:**
- Create: `apps/store/src/templates/zp2/_components/how-it-works.tsx`

- [ ] **Step 1: Criar o arquivo**

Copy dos 4 passos atualizada conforme Google Doc (Sessão 5). Imagem de fundo com overlay `bg-background/90`.

```tsx
// apps/store/src/templates/zp2/_components/how-it-works.tsx
import Image from 'next/image'

const STEPS = [
  {
    n: '1',
    title: 'Simule na hora',
    description: 'Veja suas possibilidades imediatamente.',
  },
  {
    n: '2',
    title: 'Escolha se quer avançar',
    description: 'Sem pressão, você decide.',
  },
  {
    n: '3',
    title: 'Nós cuidamos do envio',
    description: 'Sua solicitação é estruturada e enviada para instituições compatíveis.',
  },
  {
    n: '4',
    title: 'Receba retorno',
    description: 'E siga com a contratação, se fizer sentido.',
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="relative overflow-hidden border-t border-primary/8 bg-background py-24">
      <Image
        src="/images/zp2/how-it-works-bg.jpg"
        fill
        sizes="100vw"
        className="object-cover"
        alt=""
      />
      <div className="absolute inset-0 bg-background/90" />

      <div className="relative z-10 mx-auto max-w-7xl px-8">
        <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/28 bg-primary/4 px-3.5 py-2 text-xs font-medium uppercase tracking-[.22em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Como funciona
        </span>

        <h2 className="mt-4 text-5xl font-light leading-none tracking-tight text-foreground max-sm:text-4xl">
          Quatro passos para o{' '}
          <em className="font-serif text-6xl italic font-normal text-primary">
            crédito na sua mão.
          </em>
        </h2>

        <p className="mt-4 max-w-xl text-base leading-relaxed text-foreground/60">
          Processo 100% digital, sem agência, sem fila.
        </p>

        <div className="relative mt-14 grid grid-cols-4 gap-8 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <div
            className="pointer-events-none absolute left-16 right-16 top-7 hidden h-px lg:block"
            style={{
              background:
                'repeating-linear-gradient(90deg, oklch(0.83 0.10 85 / 0.30) 0 6px, transparent 6px 14px)',
            }}
            aria-hidden="true"
          />

          {STEPS.map((step) => (
            <div key={step.n} className="relative">
              <div className="relative z-10 mb-6 grid h-14 w-14 place-items-center rounded-full border border-primary/30 bg-background font-serif text-2xl italic text-primary">
                {step.n}
              </div>
              <h4 className="mb-2 text-lg font-semibold leading-tight tracking-tight text-foreground">
                {step.title}
              </h4>
              <p className="text-sm leading-relaxed text-foreground/62">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/store/src/templates/zp2/_components/how-it-works.tsx
git commit -m "feat(store): zp2 — HowItWorks com 4 passos e copy nova"
```

---

### Task 10: value-prop-section.tsx

**Files:**
- Create: `apps/store/src/templates/zp2/_components/value-prop-section.tsx`

- [ ] **Step 1: Criar o arquivo**

```tsx
// apps/store/src/templates/zp2/_components/value-prop-section.tsx
import Image from 'next/image'
import { LayoutGrid, Clock, ShieldCheck } from 'lucide-react'

const VALUE_ITEMS = [
  {
    icon: LayoutGrid,
    title: 'Mais opções',
    description: 'Comparamos instituições para encontrar a melhor para você.',
  },
  {
    icon: Clock,
    title: 'Mais velocidade',
    description: 'Sem burocracia, sem filas. Tudo online em minutos.',
  },
  {
    icon: ShieldCheck,
    title: 'Mais controle',
    description: 'Você decide o ritmo, sem pressão para avançar.',
  },
]

export function ValuePropSection() {
  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-8">
        <div className="grid grid-cols-2 items-center gap-16 max-lg:grid-cols-1">

          {/* Coluna esquerda */}
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-surface-foreground/20 bg-surface-foreground/5 px-3.5 py-2 text-xs font-medium uppercase tracking-[.22em] text-surface-foreground/60">
              <span className="h-1.5 w-1.5 rounded-full bg-surface-foreground/40" />
              Proposta de valor
            </span>

            <h2 className="mt-4 text-5xl font-light leading-tight tracking-tight text-surface-foreground max-sm:text-4xl">
              Você não precisa sair{' '}
              <em className="font-serif italic font-normal text-accent-olive">
                buscando banco por banco.
              </em>
            </h2>

            <p className="mt-4 text-base leading-relaxed text-surface-foreground/60">
              Aqui você centraliza tudo. Isso reduz erro, tempo e custo na escolha do crédito.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              {VALUE_ITEMS.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-xl border border-foreground/8 bg-white p-5"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/8">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-surface-foreground">{item.title}</p>
                    <p className="mt-0.5 text-sm text-surface-foreground/60">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna direita: imagem (oculta em mobile) */}
          <div className="relative h-96 overflow-hidden rounded-3xl max-lg:hidden">
            <Image
              src="/images/zp2/value-prop.jpg"
              fill
              sizes="(max-width: 1280px) 50vw, 640px"
              className="object-cover"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface/95 via-transparent to-transparent" />
          </div>

        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/store/src/templates/zp2/_components/value-prop-section.tsx
git commit -m "feat(store): zp2 — ValuePropSection (banco por banco)"
```

---

### Task 11: faq-section.tsx

**Files:**
- Create: `apps/store/src/templates/zp2/_components/faq-section.tsx`

- [ ] **Step 1: Criar o arquivo**

Copy das 8 FAQs conforme Google Doc (Sessão 7). Accordion shadcn com abertura individual. Número em serif italic `text-primary`.

```tsx
// apps/store/src/templates/zp2/_components/faq-section.tsx
'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQS = [
  {
    q: 'Quais tipos de crédito posso contratar?',
    a: 'Temos diferentes tipos de crédito, tanto para pessoas físicas quanto jurídicas, incluindo crédito pessoal, empréstimos com garantia, financiamentos e crédito para negócios.',
  },
  {
    q: 'Preciso comprovar renda ou ter bom score?',
    a: 'Depende da modalidade. Existem opções mais flexíveis, mas cada instituição faz sua própria análise. A simulação é o primeiro passo para entender suas possibilidades.',
  },
  {
    q: 'Como é a segurança da minha informação?',
    a: 'Trabalhamos com os melhores sistemas de proteção e todos os nossos parceiros são regulamentados pelo Banco Central.',
  },
  {
    q: 'Quanto tempo leva para o dinheiro cair na minha conta?',
    a: 'Dependendo da modalidade de crédito escolhida, temos algumas opções que o crédito cai em poucas horas.',
  },
  {
    q: 'Quais documentos são necessários para solicitar o crédito?',
    a: 'Depende da modalidade escolhida, mas geralmente você precisará de documento de identidade (RG ou CNH), CPF e comprovante de residência. Para crédito empresarial, serão necessários documentos da empresa também.',
  },
  {
    q: 'O que acontece após a simulação do crédito?',
    a: 'Você receberá as melhores ofertas disponíveis para o seu perfil. Caso queira seguir com a contratação, basta enviar a documentação necessária e aguardar a análise para a aprovação final.',
  },
  {
    q: 'Tenho que pagar alguma taxa antecipada para liberar o crédito?',
    a: 'Não! Trabalhamos apenas com instituições sérias e regulamentadas. Se alguém solicitar um pagamento antecipado para liberar o crédito, desconfie e nos avise imediatamente.',
  },
  {
    q: 'Posso antecipar parcelas ou quitar meu crédito antes do prazo?',
    a: 'Sim! A maioria das modalidades permite a quitação antecipada, muitas vezes com desconto nos juros. Consulte as condições específicas da sua oferta.',
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-8">
        <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/28 bg-primary/4 px-3.5 py-2 text-xs font-medium uppercase tracking-[.22em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Dúvidas
        </span>

        <h2 className="mt-4 text-5xl font-light leading-none tracking-tight text-foreground max-sm:text-4xl">
          Perguntas{' '}
          <em className="font-serif text-6xl italic font-normal text-primary">
            frequentes
          </em>
        </h2>

        <Accordion type="single" collapsible className="mt-10 flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <AccordionItem
              key={faq.q}
              value={`faq-${i}`}
              className="rounded-xl border border-foreground/8 px-6 data-[state=open]:border-primary/20 data-[state=open]:bg-primary/4"
            >
              <AccordionTrigger className="flex items-center gap-4 py-5 text-left text-sm font-semibold text-foreground hover:no-underline">
                <span className="shrink-0 font-serif text-xl italic text-primary">
                  {i + 1}.
                </span>
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-foreground/65">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/store && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/templates/zp2/_components/faq-section.tsx
git commit -m "feat(store): zp2 — FaqSection com Accordion shadcn (8 perguntas)"
```

---

### Task 12: home.tsx

**Files:**
- Create: `apps/store/src/templates/zp2/home.tsx`

- [ ] **Step 1: Criar o arquivo**

As fontes Plus Jakarta Sans e Instrument Serif são declaradas aqui e aplicadas via CSS variables (`--font-sans`, `--font-serif`) no wrapper raiz, sobrescrevendo Poppins/Playfair para o escopo do `zp2`.

```tsx
// apps/store/src/templates/zp2/home.tsx
import { Plus_Jakarta_Sans, Instrument_Serif } from 'next/font/google'
import type { Metadata } from 'next'
import { TenantLogo } from '@/components/tenant-logo'
import type { TemplateHomeProps } from '@/templates/_types'
import { cn } from '@/lib/utils'

import { Zp2Header } from './_components/header'
import { Zp2Footer } from './_components/footer'
import { HeroSection } from './_components/hero-section'
import { BenefitsSection } from './_components/benefits-section'
import { PartnersSection } from './_components/partners-section'
import { ProductsSection } from './_components/products-section'
import { HowItWorks } from './_components/how-it-works'
import { ValuePropSection } from './_components/value-prop-section'
import { FaqSection } from './_components/faq-section'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

const instrument = Instrument_Serif({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = { title: 'Crédito feito para você' }

export function Zp2Home({ displayName, logoUrl, products: _ }: TemplateHomeProps) {
  const name = displayName ?? 'ZP Pay'
  const logoSlot = logoUrl
    ? <TenantLogo url={logoUrl} alt={name} width={140} height={40} className="h-10 w-auto" />
    : null

  return (
    <div className={cn(jakarta.variable, instrument.variable, 'flex min-h-svh flex-col')}>
      <Zp2Header logoSlot={logoSlot} displayName={displayName} />
      <main className="flex-1">
        <HeroSection displayName={displayName} />
        <BenefitsSection />
        <PartnersSection />
        <ProductsSection />
        <HowItWorks />
        <ValuePropSection />
        <FaqSection />
      </main>
      <Zp2Footer displayName={displayName} logoUrl={logoUrl} />
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/store && npx tsc --noEmit 2>&1 | head -20
```

Resultado esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/templates/zp2/home.tsx
git commit -m "feat(store): zp2 — Zp2Home com fontes Plus Jakarta Sans + Instrument Serif"
```

---

### Task 13: Registrar zp2 no sistema de templates

**Files:**
- Modify: `apps/store/src/templates/index.ts`

- [ ] **Step 1: Adicionar zp2 no registry**

Editar `apps/store/src/templates/index.ts`:

```typescript
// apps/store/src/templates/index.ts
import type { TemplateConfig, TemplateHomeProps } from './_types'

import type { ComponentType } from 'react'

import { defaultTemplate } from './default/config'
import { DefaultHome } from './default/home'

import { zpTemplate } from './zp/config'
import { ZpHome } from './zp/home'

import { zp2Template } from './zp2/config'
import { Zp2Home } from './zp2/home'

const configRegistry: Record<string, TemplateConfig> = {
  default: defaultTemplate,
  zp: zpTemplate,
  zp2: zp2Template,
}

const homeRegistry: Record<string, ComponentType<TemplateHomeProps>> = {
  default: DefaultHome,
  zp: ZpHome,
  zp2: Zp2Home,
}

export function getTemplate(
  templateId: string | null | undefined,
): TemplateConfig {
  return configRegistry[templateId ?? 'default'] ?? defaultTemplate
}

export function getHomeComponent(
  templateId: string | null | undefined,
): ComponentType<TemplateHomeProps> {
  return homeRegistry[templateId ?? 'default'] ?? DefaultHome
}

export type {
  TemplateConfig,
  TemplateHomeProps,
  TemplateHomeProduct,
  ColorTokens,
  OklchColor,
} from './_types'
```

- [ ] **Step 2: Verificar TypeScript (verificação final)**

```bash
cd apps/store && npx tsc --noEmit 2>&1
```

Resultado esperado: sem erros. Se houver erros, corrigi-los antes de continuar.

- [ ] **Step 3: Verificar que o template `zp` original não foi modificado**

```bash
git diff apps/store/src/templates/zp/
```

Resultado esperado: sem output (nenhuma modificação).

- [ ] **Step 4: Commit final**

```bash
git add apps/store/src/templates/index.ts
git commit -m "feat(store): zp2 — registrar template no sistema (configRegistry + homeRegistry)"
```

---

## Critérios de conclusão (da spec)

- [ ] Landing page renderiza com `template_id = 'zp2'`
- [ ] Nenhum card flutuante com produtos inválidos (Crédito Pessoal / Consignado INSS)
- [ ] FAQ funcional em acordeão shadcn
- [ ] Seções alternam claro (`bg-surface`) / escuro (`bg-background`) conforme spec
- [ ] Todos os botões CTA com `bg-primary text-primary-foreground`
- [ ] Zero valores arbitrários Tailwind (`[]`)
- [ ] Imagens com `next/image` e overlay correto
- [ ] Template `zp` original inalterado
