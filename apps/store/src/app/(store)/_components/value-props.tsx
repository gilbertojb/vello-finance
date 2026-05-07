import { Clock, ShieldCheck, Zap, Headphones } from 'lucide-react'

const PROPS = [
  {
    icon: Clock,
    title: 'Resposta rápida',
    description: 'Análise em até 24 horas após o envio da proposta.',
  },
  {
    icon: ShieldCheck,
    title: 'Segurança garantida',
    description: 'Seus dados protegidos com criptografia de ponta a ponta.',
  },
  {
    icon: Zap,
    title: 'Processo simples',
    description: 'Tudo online, sem burocracia e sem sair de casa.',
  },
  {
    icon: Headphones,
    title: 'Suporte especializado',
    description: 'Equipe pronta para tirar suas dúvidas em cada etapa.',
  },
]

export function ValueProps({ displayName }: { displayName: string | null }) {
  const name = displayName ?? 'Vello'

  return (
    <section className="bg-muted/40 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Por que escolher a {name}?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Vantagens pensadas para tornar o crédito mais acessível.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROPS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-xl bg-card p-6 shadow-sm border border-border">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-1 font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
