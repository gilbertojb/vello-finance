import Link from 'next/link'
import { TenantLogo } from '@/components/tenant-logo'

type Props = {
  displayName: string | null
  logoUrl:     string | null
}

export function StoreFooter({ displayName, logoUrl }: Props) {
  const name     = displayName ?? 'Vello Store'
  const year     = new Date().getFullYear()
  const initials = name.slice(0, 2).toUpperCase()

  return (
    <footer className="border-t border-primary/[0.08] bg-background py-12">
      <div className="mx-auto max-w-7xl px-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-foreground">
            {logoUrl ? (
              <TenantLogo url={logoUrl} alt={name} width={100} height={32} className="h-8 w-auto" />
            ) : (
              <>
                <span
                  className="grid h-logo-avatar w-logo-avatar place-items-center rounded-lg bg-foreground text-sm font-extrabold italic tracking-[-0.04em] text-background"
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
