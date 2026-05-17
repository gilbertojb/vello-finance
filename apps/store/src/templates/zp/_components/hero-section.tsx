import Link from 'next/link'

type Props = {
  displayName: string | null
  minRate: number | null
}

export function HeroSection({ displayName, minRate }: Props) {
  const name = displayName ?? 'Vello Store'
  const rateDisplay =
    minRate != null ? minRate.toFixed(2).replace('.', ',') : '--'

  return (
    <section className="relative overflow-hidden border-b border-primary/8">
      <div className="mx-auto max-w-7xl px-8">
        <div className="grid grid-cols-[1.05fr_1fr] items-center gap-16 py-24 max-lg:grid-cols-1 max-lg:gap-12">
          <div>
            <span className="anim-fade-in inline-flex items-center gap-2.5 rounded-full border border-primary/28 bg-primary/4 px-3.5 py-2 text-xs font-medium uppercase tracking-[.22em] text-primary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
              </span>
              {name} · Crédito feito para você
            </span>

            <h1 className="anim-fade-up anim-d1 mb-5 mt-6 font-light leading-none tracking-tighter max-lg:text-5xl max-sm:text-4xl">
              <span className="text-5xl">Crédito inteligente para</span>{' '}
              <em className="font-serif text-7xl font-normal text-primary">
                realizar seus planos
              </em>
            </h1>

            <p className="anim-fade-up anim-d2 mb-9 max-w-lg text-base leading-relaxed text-foreground/74">
              Simule gratuitamente, compare condições e avance na contratação
              com total segurança. Rápido, digital e sem burocracia.
            </p>

            <div className="anim-fade-up anim-d3 flex flex-col gap-2.5">
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

          <div className="anim-fade-in anim-d2 relative h-hero-image max-lg:hidden">
            <div
              className="absolute inset-0 overflow-hidden rounded-3xl border border-primary/12"
              style={{
                background:
                  'radial-gradient(120% 80% at 80% 20%, oklch(0.83 0.10 85 / 0.18), transparent 55%), radial-gradient(80% 60% at 20% 90%, oklch(0.48 0.07 50 / 0.28), transparent 60%), linear-gradient(180deg, oklch(0.15 0.01 50) 0%, oklch(0.08 0.008 55) 100%)',
              }}
            />

            <div className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[.16em] text-white/35">
              Exemplo ilustrativo
            </div>

            <div className="anim-float absolute left-12 top-16 w-72 rounded-2xl border border-primary/18 bg-card p-5 shadow-[0_30px_60px_-20px_black/50]">
              <div className="mb-3.5 flex items-center justify-between text-xs font-medium uppercase tracking-[.18em] text-primary">
                <span>Limite disponível</span>
                <span className="rounded-full bg-green-500/18 px-2.5 py-1 text-[10px] text-green-400">
                  ATIVO
                </span>
              </div>
              <div className="text-4xl font-semibold leading-none tracking-tight text-foreground">
                R$ 38.500
              </div>
              <div className="mb-[18px] mt-1 text-sm font-normal text-foreground/40">
                de R$ 50.000 disponíveis
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-foreground/8">
                <div className="h-full rounded-full bg-linear-to-r from-primary/60 to-primary" style={{ width: '64%' }} />
              </div>
              <div className="mt-2.5 flex justify-between text-xs text-foreground/55">
                <span>Margem utilizada</span>
                <span className="text-primary">77%</span>
              </div>
            </div>

            <div className="absolute left-1/2 top-1/2 grid h-64 w-64 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-primary/18">
              <div
                className="absolute inset-[14px] rounded-full border border-dashed border-primary/22"
                aria-hidden="true"
              />
              <div className="text-center">
                <div className="font-serif italic text-7xl font-normal leading-none tracking-tight text-primary">
                  {rateDisplay}
                  <span className="text-2xl">%</span>
                </div>
                <div className="mt-1.5 text-xs uppercase tracking-[.22em] text-foreground/55">
                  ao mês · taxa fixa
                </div>
              </div>
            </div>

            <div className="anim-float absolute bottom-20 right-10 w-72 rounded-2xl bg-surface p-5 shadow-[0_30px_60px_-20px_black/50]" style={{ animationDelay: '2s' }}>
              <div className="text-xs font-semibold uppercase tracking-[.18em] text-surface-foreground/60">
                Parcela mensal
              </div>
              <div className="mt-1 text-lg font-semibold text-surface-foreground">
                Crédito Pessoal
              </div>
              <div className="mt-3.5 text-4xl font-semibold leading-none tracking-tight text-surface-foreground">
                R$ 312
                <span className="text-base font-normal text-surface-foreground/45">
                  ,40
                </span>
              </div>
              <div className="my-[18px] h-1.5 overflow-hidden rounded-full bg-surface-foreground/8">
                <div className="h-full rounded-full bg-primary-foreground" style={{ width: '38%' }} />
              </div>
              <div className="flex justify-between text-xs text-surface-foreground/55">
                <span>14ª de 84 parcelas</span>
                <span>R$ 38.500 total</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
