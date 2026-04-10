import { Badge } from '@/components/ui/badge'

type TenantStatus = 'pending' | 'active' | 'suspended' | 'cancelled'

const STATUS_MAP: Record<TenantStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pendente',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  },
  active: {
    label: 'Ativo',
    className:
      'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  },
  suspended: {
    label: 'Suspenso',
    className:
      'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  },
}

export function TenantStatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status as TenantStatus] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-800',
  }

  return <Badge className={config.className}>{config.label}</Badge>
}
