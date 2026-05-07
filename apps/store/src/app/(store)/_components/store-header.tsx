import Image from 'next/image'
import Link from 'next/link'

type Props = {
  logoUrl: string | null
  displayName: string | null
}

export function StoreHeader({ logoUrl, displayName }: Props) {
  const name = displayName ?? 'Vello Store'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={name}
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <span className="text-lg font-bold text-foreground">{name}</span>
          )}
        </Link>
      </div>
    </header>
  )
}
