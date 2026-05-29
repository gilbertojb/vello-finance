import { ArrowRight, Handshake, RotateCcw, Users } from 'lucide-react'
import { KpiCard } from './kpi-card'

interface Props {
  total: number
  abandoned: number
  inContracting: number
  contracted: number
}

export function ClientsKpiCards({ total, abandoned, inContracting, contracted }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiCard featured label="Total de leads" value={total} icon={<Users size={15} />} colorClass="text-primary" />
      <KpiCard label="Abandonaram" value={abandoned} icon={<RotateCcw size={15} />} colorClass="text-foreground/55" />
      <KpiCard label="Em contratação" value={inContracting} icon={<ArrowRight size={15} />} colorClass="text-warning" />
      <KpiCard label="Contrataram" value={contracted} icon={<Handshake size={15} />} colorClass="text-success" />
    </div>
  )
}
