import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: number
  icon: React.ReactNode
  featured?: boolean
  colorClass?: string
}

export function KpiCard({ label, value, icon, featured, colorClass = 'text-foreground' }: KpiCardProps) {
  return (
    <div className={cn('rounded-2xl border p-5', featured ? 'border-primary/20 bg-primary/8' : 'border-primary/10 bg-card')}>
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-foreground/55">{label}</span>
        <span className="grid size-8 place-items-center rounded-lg bg-primary/8 text-primary">{icon}</span>
      </div>
      <div className={cn('text-3xl font-semibold leading-none tracking-tight', colorClass)}>
        {value.toLocaleString('pt-BR')}
      </div>
    </div>
  )
}
