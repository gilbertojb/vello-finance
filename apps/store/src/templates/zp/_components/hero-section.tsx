import Image from 'next/image'
import Link from 'next/link'

type Props = {
  displayName: string | null
}

export function HeroSection({ displayName }: Props) {
  const name = displayName ?? 'ZP Pay'

  return (
    <section className="relative flex items-center overflow-hidden border-b border-primary/8 bg-background h-svh md:h-hero-section">
      <div className="absolute inset-0 hidden md:block">
        <Image
          src="/images/zp/hero-bg.jpg"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          alt=""
        />
        {/* <div className="absolute inset-0 bg-background/50" /> */}
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-8">
        <div className="grid grid-cols-[1.05fr_1fr] items-center gap-16 py-24 max-lg:grid-cols-1 max-lg:gap-12">
          {/* Coluna esquerda */}
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/28 bg-primary/4 px-3.5 py-2 text-xs font-medium uppercase tracking-[.22em] text-primary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
              </span>
              {name} - soluções de crédito
            </span>

            <h1 className="mb-5 mt-6 text-5xl font-light leading-none tracking-tighter max-sm:text-4xl">
              Precisa de crédito?
              <br />
              <em className="font-serif text-6xl font-normal italic text-primary max-sm:text-5xl">
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
          {/* <div className="relative h-hero-image overflow-hidden rounded-3xl border border-primary/12 max-lg:hidden">
            <Image
              src="/images/zp/hero-bg.jpg"
              fill
              sizes="(max-width: 1280px) 50vw, 640px"
              className="object-cover object-top"
              priority
              alt=""
            />
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
          </div> */}
        </div>
      </div>
    </section>
  )
}
