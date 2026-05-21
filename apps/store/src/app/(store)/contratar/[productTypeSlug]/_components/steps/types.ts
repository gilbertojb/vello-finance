import type { ProposalWithProduct } from '@/app/(store)/queries'

export type WizardStepProps = {
  proposalId: string | null
  productId: string | null
  productTypeSlug: string
  simulationId: string | null
  proposal: ProposalWithProduct | null
}

export type ProductWizardProps = WizardStepProps & { currentStep: string }

export function parseBRL(s: string): number {
  return parseFloat(s.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '')) || 0
}

export function formatBRL(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatBRLInput(n: number): string {
  return n > 0 ? new Intl.NumberFormat('pt-BR').format(n) : ''
}

export function isValidCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  const calc = (len: number) => {
    let s = 0
    for (let i = 0; i < len; i++) s += +d[i] * (len + 1 - i)
    const r = 11 - (s % 11)
    return r >= 10 ? 0 : r
  }
  return calc(9) === +d[9] && calc(10) === +d[10]
}

export function calcAge(dateStr: string): number {
  const b = new Date(dateStr), t = new Date()
  let age = t.getFullYear() - b.getFullYear()
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--
  return age
}

export function getStepData<T extends Record<string, unknown>>(proposal: WizardStepProps['proposal'], step: string): T {
  return ((proposal?.form_data as Record<string, unknown>)?.[step] ?? {}) as T
}
