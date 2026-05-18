'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveStep, finalizeEtapa2 } from '@/app/(store)/contratar/actions'
import { DocumentUploadChecklist } from '../shared/document-upload-checklist'
import type { DocumentItem } from '../shared/document-upload-checklist'
import type { WizardStepProps } from '../steps/types'

const DOCS: DocumentItem[] = [
  { type: 'matricula', label: 'Matrícula atualizada' },
  { type: 'iptu', label: 'IPTU com metragens' },
  { type: 'cnd', label: 'CND de Tributos Imobiliários', hint: 'Válido até 30 dias' },
  { type: 'endereco_imovel', label: 'Comprovante de endereço do imóvel' },
  { type: 'fotos_imovel', label: 'Fotos do imóvel (externas e internas)', accept: 'jpeg' as const },
]

type Props = WizardStepProps & { isFinalStep?: boolean; nextStep?: string; extraDocs?: DocumentItem[] }

export function DocumentosImovelStep({ proposalId, isFinalStep, nextStep, extraDocs }: Props) {
  const [, startTransition] = useTransition()
  const router = useRouter()

  function handleAllUploaded() {
    startTransition(async () => {
      if (isFinalStep) {
        await finalizeEtapa2(proposalId!)
      } else {
        const res = await saveStep({ proposalId: proposalId!, stepSlug: 'documentos-imovel', stepData: { uploaded: true }, nextStep: nextStep! })
        if ('error' in res) return
        router.push(res.redirectTo)
      }
    })
  }

  const docs = extraDocs ? [...DOCS, ...extraDocs] : DOCS
  return <DocumentUploadChecklist proposalId={proposalId!} documents={docs} onAllUploaded={handleAllUploaded} />
}
