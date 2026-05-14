import { CheckCircle2, FileCheck, FileText, XCircle } from 'lucide-react'

import type { RecentActivity } from '../queries'

// ── Design tokens ──────────────────────────────────────────────────────────────
const GREEN_ACC = '#a8d490'
const RED_ACC = '#e8a092'
const GOLD = '#e9c77b'

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
    return <CheckCircle2 size={16} style={{ color: GREEN_ACC, flexShrink: 0 }} />
  }
  if (status === 'rejected') {
    return <XCircle size={16} style={{ color: RED_ACC, flexShrink: 0 }} />
  }
  if (type === 'proposal') {
    return <FileCheck size={16} style={{ color: GOLD, flexShrink: 0 }} />
  }
  return <FileText size={16} style={{ color: 'rgba(246,239,228,.4)', flexShrink: 0 }} />
}

interface Props {
  activities: RecentActivity
}

export function ActivityFeed({ activities }: Props) {
  return (
    <div
      style={{
        background: 'var(--color-card)',
        border: '1px solid rgba(233,199,123,.10)',
        borderRadius: 14,
        padding: '20px 22px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <h3
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: '#f6efe4',
              margin: 0,
              letterSpacing: '-.005em',
            }}
          >
            Últimos eventos
          </h3>
          {/* Live dot */}
          <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
            <span
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: '#5a8a4c',
                opacity: 0.75,
                animation: 'ping 1s cubic-bezier(0,0,.2,1) infinite',
              }}
            />
            <span
              style={{
                position: 'relative',
                display: 'inline-flex',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#5a8a4c',
              }}
            />
          </span>
          <span style={{ fontSize: 11, color: 'rgba(246,239,228,.38)' }}>ao vivo</span>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(246,239,228,.45)', margin: 0 }}>Em tempo real</p>
      </div>

      <div>
        {activities.map((activity, idx) => (
          <div
            key={activity.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 0',
              borderBottom:
                idx < activities.length - 1 ? '1px solid rgba(233,199,123,.06)' : 'none',
            }}
          >
            <ActivityIcon type={activity.type} status={activity.status} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 2px', fontSize: 12.5, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 600, color: '#f6efe4' }}>{activity.client_name}</span>{' '}
                <span style={{ color: 'rgba(246,239,228,.55)' }}>{activity.action}</span>{' '}
                <span style={{ fontSize: 11, color: 'rgba(246,239,228,.35)' }}>
                  em {activity.product}
                </span>
              </p>
            </div>
            <span
              style={{
                fontSize: 11,
                color: 'rgba(246,239,228,.35)',
                flexShrink: 0,
                paddingTop: 1,
              }}
            >
              {relativeTime(activity.time)}
            </span>
          </div>
        ))}

        {activities.length === 0 && (
          <p
            style={{
              padding: '16px 0',
              textAlign: 'center',
              fontSize: 12,
              color: 'rgba(246,239,228,.38)',
            }}
          >
            Nenhuma atividade recente.
          </p>
        )}
      </div>
    </div>
  )
}
