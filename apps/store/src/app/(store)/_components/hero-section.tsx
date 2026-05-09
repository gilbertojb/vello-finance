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
    <section className="relative overflow-hidden border-b border-primary/[0.08]">
      <div className="mx-auto max-w-7xl px-8">
        <div className="grid grid-cols-[1.05fr_1fr] items-center gap-16 py-24 max-lg:grid-cols-1 max-lg:gap-12">

          {/* Esquerda */}
          <div>
            {/* TODO: [White-label] eyebrow configurável por tenant */}
            <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/28 bg-primary/[0.04] px-3.5 py-2 text-[11px] font-medium uppercase tracking-[.22em] text-primary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
              </span>
              {name} · Crédito feito para você
            </span>

            {/* TODO: [White-label] headline configurável por tenant */}
            <h1 className="mb-5 mt-6 text-7xl font-light leading-none tracking-[-0.025em] max-lg:text-5xl max-sm:text-[38px]">
              Crédito que{' '}
              <em className="font-serif not-italic font-normal text-primary">honra</em>
              <br />
              quem você é<span className="text-primary">.</span>
            </h1>

            {/* TODO: [White-label] lede configurável por tenant */}
            <p className="mb-9 max-w-[520px] text-[17px] leading-relaxed text-foreground/74">
              Empréstimos pessoais, consignados, FGTS e linhas com garantia — taxas competitivas, aprovação digital e respeito por cada história. Simule em 60 segundos.
            </p>

            <div className="flex items-center gap-3.5">
              {featuredProductId && (
                <Link
                  href={`/produto/${featuredProductId}`}
                  className="rounded-full bg-gradient-to-b from-primary to-primary/80 px-[22px] py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-10px_oklch(0.83_0.10_85/50%)] transition-all hover:brightness-110"
                >
                  Simular agora →
                </Link>
              )}
              <Link
                href="#produtos"
                className="rounded-full border border-foreground/18 px-[22px] py-3 text-sm font-medium text-foreground transition-all hover:border-primary hover:text-primary"
              >
                Ver todas as linhas
              </Link>
            </div>

            {/* TODO: [White-label] stats configuráveis por tenant */}
            <div className="mt-9 flex gap-9 border-t border-foreground/[0.08] pt-8 max-sm:hidden">
              {[
                { num: 'R$ 4,2bi', lbl: 'liberados em 2025' },
                { num: `${rateDisplay}%`, lbl: 'menor taxa a.m.' },
                { num: '24h', lbl: 'para o crédito cair' },
              ].map(({ num, lbl }) => (
                <div key={lbl}>
                  <div className="text-[30px] font-semibold leading-none tracking-tight text-primary">{num}</div>
                  <div className="mt-0.5 text-xs text-foreground/50">{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Direita — visual decorativo (oculto em mobile) */}
          <div className="relative h-[560px] max-lg:hidden">
            <div
              className="absolute inset-0 overflow-hidden rounded-3xl border border-primary/12"
              style={{
                background:
                  'radial-gradient(120% 80% at 80% 20%, oklch(0.83 0.10 85 / 0.18), transparent 55%), radial-gradient(80% 60% at 20% 90%, oklch(0.48 0.07 50 / 0.28), transparent 60%), linear-gradient(180deg, oklch(0.15 0.01 50) 0%, oklch(0.08 0.008 55) 100%)',
              }}
            />

            {/* TODO: [White-label] valores dos cards configuráveis */}
            <div className="absolute left-[50px] top-[60px] w-[280px] rounded-[18px] border border-primary/18 bg-card p-[22px] shadow-[0_30px_60px_-20px_black/50]">
              <div className="mb-3.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-[.18em] text-primary">
                <span>Pré-aprovado</span>
                <span className="rounded-full bg-green-500/[0.18] px-2.5 py-1 text-[10px] text-green-400">ATIVO</span>
              </div>
              <div className="text-[36px] font-semibold leading-none tracking-tight text-foreground">
                R$ 38.500<span className="text-base font-normal text-foreground/50"> /50k</span>
              </div>
              <div className="my-[18px] h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]">
                <div className="h-full w-[64%] rounded-full bg-gradient-to-r from-primary/60 to-primary" />
              </div>
              <div className="flex justify-between text-xs text-foreground/55">
                <span>Margem usada</span><span className="text-primary">77%</span>
              </div>
            </div>

            <div className="absolute left-1/2 top-1/2 grid h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-primary/18">
              <div className="absolute inset-[14px] rounded-full border border-dashed border-primary/22" aria-hidden="true" />
              <div className="text-center">
                <div className="font-serif italic text-[64px] font-normal leading-none tracking-tight text-primary">
                  {rateDisplay}<span className="text-2xl">%</span>
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
              <div className="my-[18px] h-1.5 overflow-hidden rounded-full bg-surface-foreground/[0.08]">
                <div className="h-full w-[38%] rounded-full bg-primary-foreground" />
              </div>
              <div className="flex justify-between text-xs text-surface-foreground/55">
                <span>14 de 84</span><span>R$ 38.500</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
