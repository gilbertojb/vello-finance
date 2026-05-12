import Link from 'next/link'

type Props = { featuredProductId: string | null }

export function CtaBanner({ featuredProductId }: Props) {
  return (
    <section className="relative overflow-hidden bg-surface py-20">
      <div className="mx-auto max-w-7xl px-8">
        <div className="grid grid-cols-[1.2fr_1fr] items-center gap-16 max-lg:grid-cols-1">
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-surface-foreground/20 bg-surface-foreground/4 px-3.5 py-2 text-[11px] font-medium uppercase tracking-[.22em] text-surface-foreground/60">
              <span className="h-1.5 w-1.5 rounded-full bg-surface-foreground/40" />
              Pronto para começar
            </span>
            <h2 className="mb-5 mt-3 text-5xl font-light leading-none tracking-tight text-surface-foreground max-lg:text-5xl max-sm:text-4xl">
              Simule sem
              <br />
              <em className="font-serif italic text-6xl font-normal text-[oklch(0.48_0.07_50)]">
                compromisso.
              </em>
            </h2>
            <p className="mb-8 max-w-[480px] text-base leading-relaxed text-surface-foreground/62">
              Veja exatamente quanto você vai pagar, em quantas parcelas e com
              qual taxa — antes de qualquer assinatura. Não afeta seu score.
            </p>
            <div className="flex gap-3.5">
              {featuredProductId && (
                <Link
                  href={`/produto/${featuredProductId}`}
                  className="rounded-full bg-surface-foreground px-[26px] py-3.5 text-sm font-semibold text-surface transition-all hover:opacity-90"
                >
                  Iniciar simulação
                </Link>
              )}
              <Link
                href="#"
                className="rounded-full border border-surface-foreground/18 px-[26px] py-3.5 text-sm font-medium text-surface-foreground transition-all hover:border-surface-foreground"
              >
                Falar com consultor
              </Link>
            </div>
          </div>

          <div className="relative rounded-[20px] border border-black/6 bg-white p-8">
            <span
              className="absolute -top-2.5 left-6 font-serif text-[90px] leading-none text-primary"
              aria-hidden="true"
            >
              &ldquo;
            </span>
            <blockquote className="mt-6 font-serif italic text-[17px] leading-relaxed text-surface-foreground">
              O atendimento me trouxe a primeira linha de crédito que respeitou
              meu tempo e minha história. Aprovado em 4 horas, sem
              constrangimento.
            </blockquote>
            <div className="mt-6 flex items-center gap-3.5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-linear-to-br from-[oklch(0.48_0.07_50)] to-[oklch(0.25_0.04_45)] text-base font-semibold text-surface">
                MR
              </div>
              <div>
                <div className="text-sm font-semibold text-surface-foreground">
                  Marcus R., 47
                </div>
                <div className="text-xs text-surface-foreground/55">
                  Consignado INSS · R$ 28.000
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
