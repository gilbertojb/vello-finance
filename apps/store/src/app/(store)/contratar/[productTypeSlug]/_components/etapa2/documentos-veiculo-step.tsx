'use client'

import { useTransition } from 'react'
import { finalizeEtapa2 } from '@/app/(store)/contratar/actions'
import { DocumentUploadChecklist } from '../shared/document-upload-checklist'
import type { DocumentItem } from '../shared/document-upload-checklist'
import type { WizardStepProps } from '../steps/types'

const DOCS: DocumentItem[] = [
  { type: 'crlv', label: 'CRLV do veículo' },
  { type: 'foto_traseira', label: 'Foto traseira do veículo', accept: 'jpeg' as const },
  { type: 'foto_placa', label: 'Foto da placa traseira', accept: 'jpeg' as const },
  { type: 'foto_chassi', label: 'Foto do chassi', accept: 'jpeg' as const },
]

export function DocumentosVeiculoStep({ proposalId }: WizardStepProps) {
  const [, startTransition] = useTransition()

  function handleAllUploaded() {
    startTransition(async () => { await finalizeEtapa2(proposalId!) })
  }

  return <DocumentUploadChecklist proposalId={proposalId!} documents={DOCS} onAllUploaded={handleAllUploaded} />
}
