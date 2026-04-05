type TenantStatus = 'pending' | 'active' | 'suspended' | 'cancelled'

const STATUS_MAP: Record<TenantStatus, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
  active: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
  suspended: { label: 'Suspenso', className: 'bg-orange-100 text-orange-800' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
}

export function TenantStatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status as TenantStatus] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-800',
  }
  return (
    <span className={`text-2xs px-2 py-0.5 rounded font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
