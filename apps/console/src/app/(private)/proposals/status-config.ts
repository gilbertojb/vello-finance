import type { badgeVariants } from '@/components/ui/badge'
import type { VariantProps } from 'class-variance-authority'

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

export interface StatusConfig {
  label: string
  variant: BadgeVariant
  className?: string
}

export const STATUS_CFG: Record<string, StatusConfig> = {
  em_analise:         { label: 'Em análise',    variant: 'secondary' },
  pre_aprovada:       { label: 'Pré-aprovada',  variant: 'outline', className: 'border-success/40 text-success' },
  necessita_detalhes: { label: 'Det. pendentes', variant: 'outline' },
  reprovada:          { label: 'Reprovada',      variant: 'destructive' },
  aprovada:           { label: 'Aprovada',       variant: 'outline', className: 'border-success/40 text-success' },
}

export const STATUS_FILTERS = [
  { label: 'Todas',          value: undefined },
  { label: 'Em análise',     value: 'em_analise' },
  { label: 'Pré-aprovada',   value: 'pre_aprovada' },
  { label: 'Det. pendentes', value: 'necessita_detalhes' },
  { label: 'Reprovada',      value: 'reprovada' },
  { label: 'Aprovada',       value: 'aprovada' },
] as const

export const PIPELINE_STATUSES = [
  'em_analise',
  'pre_aprovada',
  'necessita_detalhes',
] as const

export const COMPLETED_STATUSES = [
  'em_analise',
  'pre_aprovada',
  'necessita_detalhes',
  'reprovada',
  'aprovada',
] as const
