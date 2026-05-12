const STEPS = [
  { n: 'I',   title: 'Simule o crédito',    description: 'Escolha o produto e ajuste valor e prazo em tempo real. Veja sua parcela na hora.' },
  { n: 'II',  title: 'Preencha os dados',   description: 'Formulário digital rápido. Sem papelada, sem filas, sem agência.' },
  { n: 'III', title: 'Análise instantânea', description: 'Sua proposta é analisada em minutos. Você recebe uma resposta pelo e-mail.' },
  { n: 'IV',  title: 'Crédito aprovado',    description: 'Assine digitalmente e acompanhe pelo painel. Dinheiro disponível em até 24 horas.' },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-t border-primary/[0.08] bg-background py-24">
      <div className="mx-auto max-w-7xl px-8">
        <div className="mb-14 flex items-end justify-between gap-12 max-lg:flex-col max-lg:items-start">
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/28 bg-primary/[0.04] px-3.5 py-2 text-[11px] font-medium uppercase tracking-[.22em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Como funciona
            </span>
            <h2 className="mt-[18px] text-[54px] font-light leading-none tracking-tight text-foreground max-lg:text-5xl max-sm:text-4xl">
              Quatro passos para o<br />
              <em className="font-serif not-italic font-normal text-primary">crédito na sua mão.</em>
            </h2>
          </div>
          <p className="max-w-[420px] text-[15px] leading-relaxed text-foreground/62">
            Processo 100% digital, sem agência, sem fila. Você acompanha cada etapa em tempo real.
          </p>
        </div>

        <div className="relative grid grid-cols-4 gap-8 max-lg:grid-cols-2">
          <div
            className="pointer-events-none absolute left-[60px] right-[60px] top-[30px] hidden h-px lg:block"
            style={{ background: 'repeating-linear-gradient(90deg, oklch(0.83 0.10 85 / 0.30) 0 6px, transparent 6px 14px)' }}
            aria-hidden="true"
          />
          {STEPS.map((step) => (
            <div key={step.n} className="relative">
              <div className="relative z-10 mb-6 grid h-[60px] w-[60px] place-items-center rounded-full border border-primary/30 bg-background font-serif italic text-[26px] text-primary">
                {step.n}
              </div>
              <h4 className="mb-2 text-lg font-semibold leading-tight tracking-tight text-foreground">{step.title}</h4>
              <p className="text-[13px] leading-relaxed text-foreground/62">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
