import Image from 'next/image'
import { LayoutGrid, Clock, ShieldCheck } from 'lucide-react'

const VALUE_ITEMS = [
  {
    icon: LayoutGrid,
    title: 'Mais opções',
    description: 'Comparamos instituições para encontrar a melhor para você.',
  },
  {
    icon: Clock,
    title: 'Mais velocidade',
    description: 'Sem burocracia, sem filas. Tudo online em minutos.',
  },
  {
    icon: ShieldCheck,
    title: 'Mais controle',
    description: 'Você decide o ritmo, sem pressão para avançar.',
  },
]

export function ValuePropSection() {
  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-8">
        <div className="grid grid-cols-2 items-center gap-16 max-lg:grid-cols-1">
          {/* Coluna esquerda */}
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-surface-foreground/20 bg-surface-foreground/5 px-3.5 py-2 text-xs font-medium uppercase tracking-[.22em] text-surface-foreground/60">
              <span className="h-1.5 w-1.5 rounded-full bg-surface-foreground/40" />
              Proposta de valor
            </span>

            <h2 className="mt-4 text-5xl font-light leading-tight tracking-tight text-surface-foreground max-sm:text-4xl">
              Você não precisa sair{' '}
              <em className="font-serif text-6xl italic font-normal text-accent-olive max-sm:text-5xl">
                buscando banco por banco.
              </em>
            </h2>

            <p className="mt-4 text-base leading-relaxed text-surface-foreground/60">
              Aqui você centraliza tudo. Isso reduz erro, tempo e custo na
              escolha do crédito.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              {VALUE_ITEMS.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-xl border border-surface-foreground/8 bg-white p-5"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-background">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-surface-foreground">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-sm text-surface-foreground/60">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna direita: imagem (oculta em mobile) */}
          <div className="relative h-full overflow-hidden rounded-3xl max-lg:hidden">
            <Image
              src="/images/zp/value-props.jpg"
              fill
              sizes="(max-width: 1280px) 50vw, 640px"
              className="object-cover"
              alt=""
            />
          </div>
        </div>
      </div>
    </section>
  )
}
