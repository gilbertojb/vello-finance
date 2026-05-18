'use client'

import { useTransition } from 'react'
import { saveStep } from '@/app/(store)/contratar/actions'
import { DocumentUploadChecklist } from '../shared/document-upload-checklist'
import type { DocumentItem } from '../shared/document-upload-checklist'
import type { WizardStepProps } from '../steps/types'

const DOCS_EMPRESA: DocumentItem[] = [
  { type: 'cnpj', label: 'CNPJ' },
  { type: 'contrato_social', label: 'Contrato Social atualizado' },
  { type: 'endereco_empresa', label: 'Comprovante de endereço da empresa', hint: 'Últimos 3 meses' },
  { type: 'balanco_patrimonial', label: 'Balanço Patrimonial do último ano' },
  { type: 'balancete', label: 'Balancete dos últimos 3 meses' },
  { type: 'dre', label: 'DRE do último ano ou Simples Nacional' },
  { type: 'faturamentos', label: 'Relação dos últimos 12 faturamentos', hint: 'Com assinatura do contador' },
  { type: 'extrato_pj', label: 'Extrato bancário PJ', hint: 'Últimos 3 meses' },
  { type: 'extrato_pf', label: 'Extrato PF', hint: 'Últimos 3 meses' },
  { type: 'rg_cpf_socios', label: 'RG e CPF dos sócios (frente e verso)' },
]

type Props = WizardStepProps & { nextStep: string; extraDocs?: DocumentItem[] }

export function DocumentosEmpresaStep({ proposalId, nextStep, extraDocs }: Props) {
  const [, startTransition] = useTransition()

  function handleAllUploaded() {
    startTransition(async () => {
      await saveStep({ proposalId: proposalId!, stepSlug: 'documentos-empresa', stepData: { uploaded: true }, nextStep })
    })
  }

  return (
    <DocumentUploadChecklist
      proposalId={proposalId!}
      documents={extraDocs ? [...DOCS_EMPRESA, ...extraDocs] : DOCS_EMPRESA}
      onAllUploaded={handleAllUploaded}
    />
  )
}
