import Image from 'next/image'
import Link from 'next/link'

type Props = {
  logoUrl:     string | null
  displayName: string | null
}

export function ZpHeader({ logoUrl, displayName }: Props) {
  const name = displayName ?? 'ZP Pay'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/[0.08] bg-background/85 backdrop-blur-[14px]">
      <div className="mx-auto flex h-[78px] max-w-7xl items-center gap-10 px-8">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-foreground">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={name}
              width={140}
              height={40}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <span className="text-xl font-bold tracking-tight text-foreground">
              {name}
            </span>
          )}
        </Link>

        <nav className="ml-auto hidden items-center gap-8 text-sm text-foreground/78 md:flex">
          <Link href="#produtos"      className="transition-colors hover:text-primary">Produtos</Link>
          <Link href="#como-funciona" className="transition-colors hover:text-primary">Como funciona</Link>
          <Link href="#"              className="transition-colors hover:text-primary">Sobre</Link>
        </nav>

        <Link
          href="#produtos"
          className="ml-auto rounded-full bg-gradient-to-b from-primary to-primary/80 px-[22px] py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-10px_var(--primary)] transition-all hover:brightness-110 md:ml-0"
        >
          Simular agora
        </Link>
      </div>
    </header>
  )
}
