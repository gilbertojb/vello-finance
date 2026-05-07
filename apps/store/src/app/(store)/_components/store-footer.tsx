type Props = {
  displayName: string | null
}

export function StoreFooter({ displayName }: Props) {
  const name = displayName ?? 'Vello Store'
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <p className="text-sm text-muted-foreground">
          © {year} {name}. Todos os direitos reservados.
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">
            Política de Privacidade
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Termos de Uso
          </a>
        </div>
      </div>
    </footer>
  )
}
