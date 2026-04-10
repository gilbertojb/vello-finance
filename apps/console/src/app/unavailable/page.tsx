import { ShieldOff } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Indisponível' }

export default function UnavailablePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <ShieldOff className="size-16 text-muted-foreground/50" strokeWidth={1.5} />
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Indisponível</h1>
        <p className="text-sm text-muted-foreground">
          Este espaço está temporariamente indisponível.
        </p>
      </div>
    </div>
  )
}
