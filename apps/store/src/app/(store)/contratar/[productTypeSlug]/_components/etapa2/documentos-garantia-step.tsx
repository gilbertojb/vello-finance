'use client'

import { useTransition } from 'react'
import { finalizeEtapa2 } from '@/app/(store)/contratar/actions'
import { DocumentUploadChecklist } from '../shared/document-upload-checklist'
import type { DocumentItem } from '../shared/document-upload-checklist'
import type { WizardStepProps } from '../steps/types'

const DOCS_IMOVEL: DocumentItem[] = [
  { type: 'garantia_matricula', label: 'Matrícula atualizada' },
  { type: 'garantia_iptu', label: 'IPTU com metragens' },
  { type: 'garantia_cnd', label: 'CND de Tributos Imobiliários', hint: 'Válido até 30 dias' },
  { type: 'garantia_endereco', label: 'Comprovante de endereço do imóvel' },
  { type: 'garantia_fotos', label: 'Fotos do imóvel', accept: 'jpeg' as const },
]
const DOCS_RECEBIVEIS: DocumentItem[] = [
  { type: 'recebiveis_extrato', label: 'Extrato de vendas / recebíveis', hint: 'Últimos 3 meses' },
  { type: 'recebiveis_contratos', label: 'Contratos / notas fiscais' },
]
const DOCS_DEFAULT: DocumentItem[] = [
  { type: 'garantia_comprovante', label: 'Documento comprobatório da garantia' },
]

export function DocumentosGarantiaStep({ proposalId, proposal }: WizardStepProps) {
  const formData = proposal?.form_data as Record<string, unknown> | undefined
  const tipoGarantia = (formData?.['garantia'] as Record<string, unknown> | undefined)?.['tipoGarantia'] as string | undefined
  const tipoRecebivel = (formData?.['operacao'] as Record<string, unknown> | undefined)?.['tipoRecebivel'] as string | undefined
  const [, startTransition] = useTransition()

  const docs = tipoGarantia === 'Imóvel Empresarial' ? DOCS_IMOVEL
    : tipoRecebivel ? DOCS_RECEBIVEIS
    : DOCS_DEFAULT

  function handleAllUploaded() {
    startTransition(async () => { await finalizeEtapa2(proposalId!) })
  }

  return <DocumentUploadChecklist proposalId={proposalId!} documents={docs} onAllUploaded={handleAllUploaded} />
}
