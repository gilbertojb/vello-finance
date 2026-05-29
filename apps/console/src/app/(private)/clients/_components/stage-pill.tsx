import type { LeadStage } from '../queries'

const STAGE_CONFIG: Record<LeadStage, { label: string; bg: string; color: string }> = {
  abandoned: {
    label: 'Abandonou',
    bg: 'color-mix(in oklch, var(--muted-foreground) 12%, transparent)',
    color: 'var(--muted-foreground)',
  },
  simulated: {
    label: 'Simulou',
    bg: 'color-mix(in oklch, var(--primary) 14%, transparent)',
    color: 'var(--primary)',
  },
  in_contracting: {
    label: 'Em contratação',
    bg: 'color-mix(in oklch, var(--warning) 14%, transparent)',
    color: 'var(--warning)',
  },
  contracted: {
    label: 'Contratou',
    bg: 'color-mix(in oklch, var(--success) 14%, transparent)',
    color: 'var(--success)',
  },
}

interface Props {
  stage: LeadStage
}

export function StagePill({ stage }: Props) {
  const cfg = STAGE_CONFIG[stage]
  return (
    <span
      style={{ background: cfg.bg, color: cfg.color }}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
    >
      <span className="size-1.5 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  )
}
