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
