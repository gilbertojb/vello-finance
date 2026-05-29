import { ArrowRight, Handshake, RotateCcw, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardFunnelKpis } from '../queries'

interface CardProps {
  label: string
  value: number
  icon: React.ReactNode
  color: 'muted' | 'primary' | 'warning' | 'success'
}

function FunnelCard({ label, value, icon, color }: CardProps) {
  const colorMap = {
    muted:   'border-primary/10 bg-card text-foreground/55',
    primary: 'border-primary/10 bg-card text-primary',
    warning: 'border-primary/10 bg-card text-warning',
    success: 'border-primary/10 bg-card text-success',
  }
  const iconBg = {
    muted:   'bg-foreground/6 text-foreground/40',
    primary: 'bg-primary/8 text-primary',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
  }
  return (
    <div className={cn('rounded-2xl border p-5', colorMap[color])}>
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-foreground/55">{label}</span>
        <span className={cn('grid size-8 place-items-center rounded-lg', iconBg[color])}>{icon}</span>
      </div>
      <div className={cn('text-3xl font-semibold leading-none tracking-tight', colorMap[color])}>
        {value.toLocaleString('pt-BR')}
      </div>
    </div>
  )
}

interface Props {
  kpis: DashboardFunnelKpis
}

export function FunnelKpiCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <FunnelCard label="Abandonaram" value={kpis.abandonaram} icon={<RotateCcw size={15} />} color="muted" />
      <FunnelCard label="Apenas simularam" value={kpis.apenasSimularam} icon={<Sparkles size={15} />} color="primary" />
      <FunnelCard label="Em contratação" value={kpis.emContratacao} icon={<ArrowRight size={15} />} color="warning" />
      <FunnelCard label="Contrataram" value={kpis.contrataram} icon={<Handshake size={15} />} color="success" />
    </div>
  )
}
