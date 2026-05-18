import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Building2, TrendingUp, User } from 'lucide-react'

export const metadata: Metadata = { title: 'Simulador de Crédito' }

export default function SimuladorPage() {
  return (
    <div className="min-h-[calc(100vh-78px)] bg-surface text-surface-foreground">
      <div className="mx-auto max-w-2xl px-6 py-16 md:py-20">

        {/* Header — esquerda, sem centralização */}
        <div className="mb-12">
          <span className="anim-fade-up inline-flex items-center gap-2 rounded-full border border-surface-foreground/12 bg-surface-foreground/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[.2em] text-surface-foreground/45">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Simulação gratuita
          </span>
          <h1 className="anim-fade-up anim-d1 mt-5 text-[2.5rem] font-bold leading-[1.1] tracking-tight text-surface-foreground sm:text-5xl">
            Qual crédito<br />você precisa?
          </h1>
          <p className="anim-fade-up anim-d2 mt-4 max-w-[44ch] text-[0.9375rem] leading-relaxed text-surface-foreground/55">
            Simule em menos de 1 minuto. Sem cadastro, sem compromisso.
          </p>
        </div>

        {/* Grid assimétrico */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

          {/* Card em destaque — largura total */}
          <Link
            href="/simulador/pessoa-fisica"
            className="group anim-fade-up anim-d3 col-span-1 flex overflow-hidden rounded-2xl border border-surface-foreground/10 bg-white transition-colors duration-150 hover:border-surface-foreground/20 sm:col-span-2"
          >
            <div className="flex flex-1 items-center gap-5 p-6 sm:p-7">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[.2em] text-surface-foreground/35">
                  Mais simulado
                </p>
                <h2 className="text-base font-bold leading-tight tracking-tight text-surface-foreground">
                  Crédito Pessoa Física
                </h2>
                <p className="mt-1 text-sm leading-snug text-surface-foreground/50">
                  FGTS, consignado, veículo ou imóvel em garantia
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-surface-foreground/25 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </div>
            <div className="hidden flex-col justify-center gap-1.5 self-stretch border-l border-surface-foreground/8 bg-surface-foreground/[0.025] px-5 py-5 sm:flex" style={{ minWidth: '168px' }}>
              {['FGTS', 'Consignado CLT', 'Veículo em Garantia', 'Imóvel em Garantia'].map((item) => (
                <span
                  key={item}
                  className="w-fit rounded-full bg-surface-foreground/7 px-2.5 py-1 text-xs font-medium text-surface-foreground/50"
                >
                  {item}
                </span>
              ))}
            </div>
          </Link>

          {/* PJ */}
          <Link
            href="/simulador/pessoa-juridica"
            className="group anim-fade-up anim-d4 flex flex-col rounded-2xl border border-surface-foreground/10 bg-white transition-colors duration-150 hover:border-surface-foreground/20"
          >
            <div className="flex flex-col gap-3.5 p-5">
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Building2 className="h-[18px] w-[18px]" />
                </div>
                <ArrowRight className="h-4 w-4 text-surface-foreground/20 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[.2em] text-surface-foreground/35">
                  Pessoa Jurídica
                </p>
                <h2 className="text-[15px] font-bold leading-tight tracking-tight text-surface-foreground">
                  Crédito para Empresas
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-surface-foreground/50">
                  Capital de giro, antecipação de recebíveis e garantias
                </p>
              </div>
            </div>
            <div className="mt-auto flex flex-wrap gap-1.5 border-t border-surface-foreground/8 px-5 py-3">
              {['Capital de Giro', 'Recebíveis'].map((item) => (
                <span key={item} className="rounded-full bg-surface-foreground/7 px-2.5 py-1 text-xs font-medium text-surface-foreground/45">
                  {item}
                </span>
              ))}
            </div>
          </Link>

          {/* Financiamentos */}
          <Link
            href="/simulador/financiamentos"
            className="group anim-fade-up anim-d5 flex flex-col rounded-2xl border border-surface-foreground/10 bg-white transition-colors duration-150 hover:border-surface-foreground/20"
          >
            <div className="flex flex-col gap-3.5 p-5">
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <TrendingUp className="h-[18px] w-[18px]" />
                </div>
                <ArrowRight className="h-4 w-4 text-surface-foreground/20 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[.2em] text-surface-foreground/35">
                  Financiamentos
                </p>
                <h2 className="text-[15px] font-bold leading-tight tracking-tight text-surface-foreground">
                  Imóvel e Veículo
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-surface-foreground/50">
                  Financiamento imobiliário e de veículos com boas condições
                </p>
              </div>
            </div>
            <div className="mt-auto flex flex-wrap gap-1.5 border-t border-surface-foreground/8 px-5 py-3">
              {['Imóvel', 'Veículo'].map((item) => (
                <span key={item} className="rounded-full bg-surface-foreground/7 px-2.5 py-1 text-xs font-medium text-surface-foreground/45">
                  {item}
                </span>
              ))}
            </div>
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="anim-fade-up anim-d6 mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
          {['Sem cadastro obrigatório', 'Resultado em menos de 1 min', '100% gratuito'].map((text) => (
            <p key={text} className="flex items-center gap-1.5 text-xs text-surface-foreground/35">
              <span className="h-1 w-1 rounded-full bg-primary/50" />
              {text}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
