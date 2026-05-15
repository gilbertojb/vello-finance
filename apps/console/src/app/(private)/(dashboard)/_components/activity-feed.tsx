import { CheckCircle2, FileCheck, FileText, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    return <CheckCircle2 size={16} className="shrink-0 text-success" />
  }
  if (status === 'rejected') {
    return <XCircle size={16} className="shrink-0 text-destructive" />
  }
  if (type === 'proposal') {
    return <FileCheck size={16} className="shrink-0 text-primary" />
  }
  return <FileText size={16} className="shrink-0 text-foreground/40" />
}

interface Props {
  activities: RecentActivity
}

export function ActivityFeed({ activities }: Props) {
  return (
    <div className="rounded-[14px] border border-primary/10 bg-card p-5">
      <div className="mb-4">
        <div className="mb-0.5 flex items-center gap-2">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
            Últimos eventos
          </h3>
          <span className="relative inline-flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          <span className="text-[11px] text-foreground/38">ao vivo</span>
        </div>
        <p className="text-xs text-foreground/45">Em tempo real</p>
      </div>

      <div>
        {activities.map((activity, idx) => (
          <div
            key={activity.id}
            className={cn(
              'flex items-start gap-2.5 py-2.5',
              idx < activities.length - 1 && 'border-b border-primary/6',
            )}
          >
            <ActivityIcon type={activity.type} status={activity.status} />
            <div className="min-w-0 flex-1">
              <p className="m-0 mb-0.5 text-[12.5px] leading-snug">
                <span className="font-semibold text-foreground">{activity.client_name}</span>{' '}
                <span className="text-foreground/55">{activity.action}</span>{' '}
                <span className="text-[11px] text-foreground/35">em {activity.product}</span>
              </p>
            </div>
            <span className="shrink-0 pt-px text-[11px] text-foreground/35">
              {relativeTime(activity.time)}
            </span>
          </div>
        ))}

        {activities.length === 0 && (
          <p className="py-4 text-center text-xs text-foreground/38">
            Nenhuma atividade recente.
          </p>
        )}
      </div>
    </div>
  )
}
