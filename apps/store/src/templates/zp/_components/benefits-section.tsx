import {
  ShieldCheck,
  Users,
  LayoutGrid,
  TrendingUp,
  CircleDollarSign,
} from 'lucide-react'

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'Processo simples e 100% online',
    description:
      'Sem papelada, sem filas, sem agência. Tudo pelo celular ou computador.',
  },
  {
    icon: Users,
    title: 'Crédito para todos os perfis',
    description:
      'Diferentes modalidades para diferentes momentos da sua vida financeira.',
  },
  {
    icon: LayoutGrid,
    title: 'Compare várias opções de uma vez',
    description:
      'Receba múltiplas ofertas de instituições parceiras em um só lugar.',
  },
  {
    icon: TrendingUp,
    title: 'Aumenta suas chances de aprovação',
    description:
      'Sua solicitação chega para as instituições mais compatíveis com o seu perfil.',
  },
  {
    icon: CircleDollarSign,
    title: 'Pode encontrar taxas melhores',
    description:
      'A concorrência entre parceiros tende a gerar condições mais favoráveis para você.',
  },
]

export function BenefitsSection() {
  return (
    <section className="relative overflow-hidden bg-surface py-24">
      <div className="relative z-10 mx-auto max-w-7xl px-8">
        <span className="inline-flex items-center gap-2.5 rounded-full border border-surface-foreground/20 bg-surface-foreground/5 px-3.5 py-2 text-xs font-medium uppercase tracking-[.22em] text-surface-foreground/60">
          <span className="h-1.5 w-1.5 rounded-full bg-surface-foreground/40" />
          Por que a gente
        </span>

        <h2 className="mt-4 text-5xl font-light leading-none tracking-tight text-surface-foreground max-sm:text-4xl">
          Benefícios de contratar{' '}
          <em className="font-serif text-6xl italic font-normal text-accent-olive max-sm:text-5xl">
            crédito com a gente
          </em>
        </h2>

        <div className="mt-12 grid grid-cols-3 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-surface-foreground/8 bg-white p-6"
            >
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-background">
                <b.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold leading-tight text-surface-foreground">
                {b.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-surface-foreground/60">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
