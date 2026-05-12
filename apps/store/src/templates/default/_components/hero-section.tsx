import Link from 'next/link'

type Props = {
  displayName: string | null
  featuredProductId: string | null
  minRate: number | null
}

export function HeroSection({ displayName, featuredProductId, minRate }: Props) {
  const name = displayName ?? 'Vello Store'
  const rateDisplay = minRate != null ? minRate.toFixed(2).replace('.', ',') : '--'

  return (
    <section className="relative overflow-hidden border-b border-primary/8">
      <div className="mx-auto max-w-7xl px-8">
        <div className="grid grid-cols-[1.05fr_1fr] items-center gap-16 py-24 max-lg:grid-cols-1 max-lg:gap-12">
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/28 bg-primary/4 px-3.5 py-2 text-[11px] font-medium uppercase tracking-[.22em] text-primary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
              </span>
              {name} · Crédito feito para você
            </span>

            <h1 className="mb-5 mt-6 font-light leading-none tracking-tighter max-lg:text-5xl max-sm:text-[38px]">
              <span className="text-5xl">Crédito inteligente para</span>{' '}
              <em className="font-serif text-7xl font-normal text-primary">
                realizar seus planos
              </em>
            </h1>

            <p className="mb-9 max-w-[520px] text-[17px] leading-relaxed text-foreground/74">
              Simule gratuitamente, compare condições e avance na contratação
              com total segurança. Rápido, digital e sem burocracia.
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
                href={featuredProductId ? `/produto/${featuredProductId}` : '#produtos'}
                className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/18 px-6 py-4 text-sm font-semibold text-primary transition-all hover:bg-primary/25"
              >
                <span>Fazer Simulação Gratuita</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          <div className="relative h-[560px] max-lg:hidden">
            <div
              className="absolute inset-0 overflow-hidden rounded-3xl border border-primary/12"
              style={{
                background:
                  'radial-gradient(120% 80% at 80% 20%, oklch(0.83 0.10 85 / 0.18), transparent 55%), radial-gradient(80% 60% at 20% 90%, oklch(0.48 0.07 50 / 0.28), transparent 60%), linear-gradient(180deg, oklch(0.15 0.01 50) 0%, oklch(0.08 0.008 55) 100%)',
              }}
            />

            <div className="absolute left-[50px] top-[60px] w-[280px] rounded-[18px] border border-primary/18 bg-card p-[22px] shadow-[0_30px_60px_-20px_black/50]">
              <div className="mb-3.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-[.18em] text-primary">
                <span>Pré-aprovado</span>
                <span className="rounded-full bg-green-500/18 px-2.5 py-1 text-[10px] text-green-400">ATIVO</span>
              </div>
              <div className="text-[36px] font-semibold leading-none tracking-tight text-foreground">
                R$ 38.500
                <span className="text-base font-normal text-foreground/50"> /50k</span>
              </div>
              <div className="my-[18px] h-1.5 overflow-hidden rounded-full bg-foreground/8">
                <div className="h-full w-[64%] rounded-full bg-linear-to-r from-primary/60 to-primary" />
              </div>
              <div className="flex justify-between text-xs text-foreground/55">
                <span>Margem usada</span>
                <span className="text-primary">77%</span>
              </div>
            </div>

            <div className="absolute left-1/2 top-1/2 grid h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-primary/18">
              <div className="absolute inset-[14px] rounded-full border border-dashed border-primary/22" aria-hidden="true" />
              <div className="text-center">
                <div className="font-serif italic text-[64px] font-normal leading-none tracking-tight text-primary">
                  {rateDisplay}
                  <span className="text-2xl">%</span>
                </div>
                <div className="mt-1.5 text-[11px] uppercase tracking-[.22em] text-foreground/55">a.m. · taxa fixa</div>
              </div>
            </div>

            <div className="absolute bottom-[80px] right-[40px] w-[280px] rounded-[18px] bg-surface p-[22px] shadow-[0_30px_60px_-20px_black/50]">
              <div className="text-[11px] font-semibold uppercase tracking-[.18em] text-surface-foreground/60">Parcela mensal</div>
              <div className="mt-1 text-lg font-semibold text-surface-foreground">Crédito Pessoal</div>
              <div className="mt-3.5 text-[36px] font-semibold leading-none tracking-tight text-surface-foreground">
                R$ 312<span className="text-base font-normal text-surface-foreground/45">,40</span>
              </div>
              <div className="my-[18px] h-1.5 overflow-hidden rounded-full bg-surface-foreground/8">
                <div className="h-full w-[38%] rounded-full bg-primary-foreground" />
              </div>
              <div className="flex justify-between text-xs text-surface-foreground/55">
                <span>14 de 84</span>
                <span>R$ 38.500</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
