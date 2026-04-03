const TYPE_MAP: Record<string, { label: string; color: string }> = {
  fgts: { label: 'FGTS', color: 'bg-emerald-100 text-emerald-800' },
  consignado_publico: {
    label: 'Consig. Público',
    color: 'bg-blue-100 text-blue-800',
  },
  consignado_privado: {
    label: 'Consig. Privado',
    color: 'bg-indigo-100 text-indigo-800',
  },
  home_equity: { label: 'Home Equity', color: 'bg-purple-100 text-purple-800' },
  auto_equity: { label: 'Auto Equity', color: 'bg-orange-100 text-orange-800' },
  outros: { label: 'Outros', color: 'bg-gray-100 text-gray-800' },
}

export function ProductTypeBadge({ type }: { type: string }) {
  const info = TYPE_MAP[type] || TYPE_MAP.outros

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${info.color}`}
    >
      {info.label}
    </span>
  )
}
