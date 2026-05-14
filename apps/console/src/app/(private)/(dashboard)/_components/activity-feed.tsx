import { CheckCircle2, FileCheck, FileText, XCircle } from 'lucide-react'

import { Card } from '@/components/ui/card'

import type { RecentActivity } from '../queries'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `há ${hrs}h`
  return `há ${Math.floor(hrs / 24)}d`
}

function ActivityIcon({ type, status }: { type: 'simulation' | 'proposal'; status: string }) {
  if (status === 'approved') {
    return <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
  }
  if (status === 'rejected') {
    return <XCircle className="size-4 shrink-0 text-red-400" />
  }
  if (type === 'proposal') {
    return <FileCheck className="size-4 shrink-0 text-amber-400" />
  }
  return <FileText className="size-4 shrink-0 text-muted-foreground" />
}

interface Props {
  activities: RecentActivity
}

export function ActivityFeed({ activities }: Props) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
            Atividade
          </p>
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex size-2 rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[10px] text-muted-foreground">ao vivo</span>
        </div>
        <h2 className="font-heading text-xl font-medium">Últimos eventos</h2>
        <p className="text-xs text-muted-foreground">Em tempo real</p>
      </div>

      <div className="flex flex-col gap-0.5">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-2.5 rounded-md px-1 py-2 hover:bg-muted/30 transition-colors"
          >
            <ActivityIcon type={activity.type} status={activity.status} />
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-snug">
                <span className="font-medium">{activity.client_name}</span>{' '}
                <span className="text-muted-foreground">{activity.action}</span>{' '}
                <span className="text-[10px] text-muted-foreground/70">
                  em {activity.product}
                </span>
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {relativeTime(activity.time)}
              </p>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Nenhuma atividade recente.
          </p>
        )}
      </div>
    </Card>
  )
}
