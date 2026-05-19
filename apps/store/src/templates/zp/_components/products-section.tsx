import Link from 'next/link'
import { ArrowRight, User, Building2, Home } from 'lucide-react'

const CATEGORIES = [
  {
    icon: User,
    title: 'Crédito Pessoa Física',
    href: '/simulador/pessoa-fisica',
    items: ['Saque FGTS', 'Garantia de Imóvel', 'Garantia de Veículo'],
  },
  {
    icon: Building2,
    title: 'Crédito Pessoa Jurídica',
    href: '/simulador/pessoa-juridica',
    items: [
      'Capital de Giro',
      'Antecipação de Recebíveis',
      'Crédito com Garantia',
    ],
  },
  {
    icon: Home,
    title: 'Financiamentos',
    href: '/simulador/financiamentos',
    items: ['Financiamento de Imóvel', 'Financiamento de Veículo'],
  },
]

export function ProductsSection() {
  return (
    <section id="produtos" className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-8">
        <span className="inline-flex items-center gap-2.5 rounded-full border border-surface-foreground/20 bg-surface-foreground/5 px-3.5 py-2 text-xs font-medium uppercase tracking-[.22em] text-surface-foreground/60">
          <span className="h-1.5 w-1.5 rounded-full bg-surface-foreground/40" />
          Catálogo de crédito
        </span>

        <h2 className="mt-4 text-5xl font-light leading-none tracking-tight text-surface-foreground max-sm:text-4xl">
          Soluções completas{' '}
          <em className="font-serif text-6xl italic font-normal text-accent-olive max-sm:text-5xl">
            para cada perfil
          </em>
        </h2>

        <p className="mt-4 max-w-xl text-base leading-relaxed text-surface-foreground/60">
          Escolha o tipo de crédito que melhor se encaixa no seu momento.
        </p>

        <div className="mt-12 grid grid-cols-3 gap-4 max-lg:grid-cols-1">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.title}
              href={cat.href}
              className="group flex flex-col rounded-2xl border border-surface-foreground/12 bg-white p-8 transition-all hover:-translate-y-0.5 hover:border-surface-foreground/25 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-primary/8">
                <cat.icon className="h-6 w-6 text-primary" />
              </div>

              <h3 className="text-lg font-semibold leading-tight text-surface-foreground">
                {cat.title}
              </h3>

              <ul className="mt-4 flex flex-col gap-1.5">
                {cat.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-surface-foreground/60"
                  >
                    <span className="h-1 w-1 shrink-0 rounded-full bg-primary/50" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-primary">
                Simular
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/simulador"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
          >
            Simular meu crédito
          </Link>
        </div>
      </div>
    </section>
  )
}
