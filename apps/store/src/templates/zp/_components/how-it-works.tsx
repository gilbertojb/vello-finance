import Image from 'next/image'

const STEPS = [
  {
    n: '1',
    title: 'Simule na hora',
    description: 'Veja suas possibilidades imediatamente.',
  },
  {
    n: '2',
    title: 'Escolha se quer avançar',
    description: 'Sem pressão, você decide.',
  },
  {
    n: '3',
    title: 'Nós cuidamos do envio',
    description:
      'Sua solicitação é estruturada e enviada para instituições compatíveis.',
  },
  {
    n: '4',
    title: 'Receba retorno',
    description: 'E siga com a contratação, se fizer sentido.',
  },
]

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="relative overflow-hidden border-t border-primary/8 bg-background py-24"
    >
      <Image
        src="/images/zp/how-it-works-bg.jpg"
        fill
        sizes="100vw"
        className="object-cover"
        alt=""
      />
      <div className="absolute inset-0 bg-background/90" />

      <div className="relative z-10 mx-auto max-w-7xl px-8">
        <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/28 bg-primary/4 px-3.5 py-2 text-xs font-medium uppercase tracking-[.22em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Como funciona
        </span>

        <h2 className="mt-4 text-5xl font-light leading-none tracking-tight text-foreground max-sm:text-4xl">
          Quatro passos para o{' '}
          <em className="font-serif text-6xl italic font-normal text-primary max-sm:text-5xl">
            crédito na sua mão.
          </em>
        </h2>

        <p className="mt-4 max-w-xl text-base leading-relaxed text-foreground/60">
          Processo 100% digital, sem agência, sem fila.
        </p>

        <div className="relative mt-14 grid grid-cols-4 gap-8 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <div
            className="pointer-events-none absolute left-16 right-16 top-7 hidden h-px lg:block"
            style={{
              background:
                'repeating-linear-gradient(90deg, oklch(0.83 0.10 85 / 0.30) 0 6px, transparent 6px 14px)',
            }}
            aria-hidden="true"
          />

          {STEPS.map((step) => (
            <div key={step.n} className="relative">
              <div className="relative z-10 mb-6 grid h-14 w-14 place-items-center rounded-full border border-primary/30 bg-background font-serif text-2xl italic text-primary">
                {step.n}
              </div>
              <h4 className="mb-2 text-lg font-semibold leading-tight tracking-tight text-foreground">
                {step.title}
              </h4>
              <p className="text-sm leading-relaxed text-foreground/62">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
