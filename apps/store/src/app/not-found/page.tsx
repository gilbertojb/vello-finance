import { SearchX } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Não encontrado' }

export default function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <SearchX className="size-16 text-muted-foreground/50" strokeWidth={1.5} />
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">404</h1>
        <p className="text-sm text-muted-foreground">
          A loja que você procura não foi encontrada.
        </p>
      </div>
    </div>
  )
}
