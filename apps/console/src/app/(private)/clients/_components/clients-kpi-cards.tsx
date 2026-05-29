import { ArrowRight, Handshake, RotateCcw, Users } from 'lucide-react'
import { KpiCard } from './kpi-card'

interface Props {
  total: number
  abandonaram: number
  emContratacao: number
  contrataram: number
}

export function ClientsKpiCards({ total, abandonaram, emContratacao, contrataram }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiCard featured label="Total de leads" value={total} icon={<Users size={15} />} colorClass="text-primary" />
      <KpiCard label="Abandonaram" value={abandonaram} icon={<RotateCcw size={15} />} colorClass="text-foreground/55" />
      <KpiCard label="Em contratação" value={emContratacao} icon={<ArrowRight size={15} />} colorClass="text-warning" />
      <KpiCard label="Contrataram" value={contrataram} icon={<Handshake size={15} />} colorClass="text-success" />
    </div>
  )
}
