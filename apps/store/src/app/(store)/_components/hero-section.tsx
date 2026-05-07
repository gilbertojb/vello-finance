type Props = {
  displayName: string | null
  bgImageUrl: string | null
}

export function HeroSection({ displayName, bgImageUrl }: Props) {
  const name = displayName ?? 'nossa plataforma'

  return (
    <section className="relative overflow-hidden">
      {bgImageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImageUrl})` }}
        >
          <div className="absolute inset-0 bg-foreground/60" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary" />
      )}

      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <div className="max-w-xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary-foreground/70">
            {name}
          </p>
          <h1 className="mb-6 text-4xl font-bold leading-tight text-primary-foreground sm:text-5xl">
            Crédito descomplicado para você
          </h1>
          <p className="mb-8 text-lg text-primary-foreground/80">
            Simule, escolha e solicite seu crédito em minutos. Sem burocracia.
          </p>
          <a
            href="#produtos"
            className="inline-flex items-center rounded-lg bg-primary-foreground px-6 py-3 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
          >
            Ver produtos disponíveis
          </a>
        </div>
      </div>
    </section>
  )
}
