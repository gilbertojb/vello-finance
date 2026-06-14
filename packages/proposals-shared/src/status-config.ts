export const STATUS_LABELS: Record<string, string> = {
  nova_proposta:      'Nova proposta',
  em_analise:         'Em análise',
  pre_aprovada:       'Pré-aprovada',
  necessita_detalhes: 'Det. pendentes',
  reprovada:          'Reprovada',
  aprovada:           'Aprovada',
}

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

export type ProposalStatus = keyof typeof STATUS_LABELS

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}
