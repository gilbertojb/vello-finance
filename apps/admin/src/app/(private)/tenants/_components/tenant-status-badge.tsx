import { Badge } from '@/components/ui/badge'

type TenantStatus = 'pending' | 'active' | 'suspended' | 'cancelled'

type BadgeVariant = 'warning' | 'success' | 'destructive' | 'secondary'

const STATUS_MAP: Record<TenantStatus, { label: string; variant: BadgeVariant }> = {
  pending: {
    label: 'Pendente',
    variant: 'warning',
  },
  active: {
    label: 'Ativo',
    variant: 'success',
  },
  suspended: {
    label: 'Suspenso',
    variant: 'warning',
  },
  cancelled: {
    label: 'Cancelado',
    variant: 'destructive',
  },
}

export function TenantStatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status as TenantStatus] ?? {
    label: status,
    variant: 'secondary' as BadgeVariant,
  }

  return <Badge variant={config.variant}>{config.label}</Badge>
}
