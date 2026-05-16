import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Building2, Car, Home, TrendingUp, User, Zap } from 'lucide-react'

export const metadata: Metadata = { title: 'Simulador de Crédito' }

const CATEGORIES = [
  {
    href:        '/simulador/pessoa-fisica',
    label:       'Crédito Pessoa Física',
    description: 'FGTS, consignado, veículo ou imóvel em garantia.',
    icon:        User,
    items:       ['FGTS', 'Consignado CLT', 'Veículo em Garantia', 'Imóvel em Garantia'],
  },
  {
    href:        '/simulador/pessoa-juridica',
    label:       'Crédito Pessoa Jurídica',
    description: 'Capital de giro, antecipação de recebíveis e garantias.',
    icon:        Building2,
    items:       ['Capital de Giro', 'Antecipação de Recebíveis', 'Imóvel em Garantia PJ'],
  },
  {
    href:        '/simulador/financiamentos',
    label:       'Financiamentos',
    description: 'Financiamento imobiliário e de veículos.',
    icon:        TrendingUp,
    items:       ['Financiamento Imobiliário', 'Financiamento de Veículos'],
  },
]

export default function SimuladorPage() {
  return (
    <div className="min-h-[calc(100vh-78px)] bg-surface py-16 text-surface-foreground">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-surface-foreground/15 bg-surface-foreground/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[.2em] text-surface-foreground/50">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Simulação gratuita
          </span>
          <h1 className="mt-5 text-[36px] font-bold leading-tight tracking-tight text-surface-foreground">
            Qual crédito você precisa?
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-surface-foreground/55">
            Escolha a categoria e simule em menos de 1 minuto. Sem cadastro, sem compromisso.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {CATEGORIES.map(({ href, label, description, icon: Icon, items }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col overflow-hidden rounded-[22px] border border-black/[0.07] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-15px_oklch(0.12_0.01_50/12%)]"
            >
              <div className="flex items-start gap-5 p-7 pb-5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[17px] font-bold leading-tight tracking-tight text-surface-foreground">
                      {label}
                    </h2>
                    <ArrowRight className="h-4 w-4 shrink-0 text-surface-foreground/30 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <p className="mt-1 text-sm text-surface-foreground/55">{description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 border-t border-black/[0.06] bg-black/[0.015] px-7 py-3.5">
                {items.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-surface-foreground/7 px-2.5 py-1 text-[11px] font-medium text-surface-foreground/55"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
