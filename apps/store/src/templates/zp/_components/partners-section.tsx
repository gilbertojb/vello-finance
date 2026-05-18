import Link from 'next/link'

const PARTNERS = ['Itaú', 'Bradesco', 'Santander', 'Creditas', 'CashMe']

export function PartnersSection() {
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/28 bg-primary/4 px-3.5 py-2 text-xs font-medium uppercase tracking-[.22em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Parceiros
          </span>

          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-foreground/60">
            Parceiros de confiança, oferecendo as melhores condições para você.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {PARTNERS.map((partner) => (
              <div
                key={partner}
                className="flex h-9 items-center rounded-lg border border-foreground/8 bg-foreground/4 px-5 text-sm font-medium text-foreground/50"
              >
                {partner}
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/simulador"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
            >
              Simule seu crédito agora
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
