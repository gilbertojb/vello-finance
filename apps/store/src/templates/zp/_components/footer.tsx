import Image from 'next/image'
import Link from 'next/link'

type Props = {
  logoUrl:     string | null
  displayName: string | null
}

export function ZpFooter({ logoUrl, displayName }: Props) {
  const name = displayName ?? 'ZP Pay'
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-primary/[0.08] bg-background py-12">
      <div className="mx-auto max-w-7xl px-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-foreground">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={name}
                width={120}
                height={36}
                className="h-9 w-auto object-contain"
              />
            ) : (
              <span className="text-lg font-bold tracking-tight text-foreground">
                {name}
              </span>
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
