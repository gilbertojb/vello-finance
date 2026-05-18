'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveStep } from '@/app/(store)/contratar/actions'
import { DocumentUploadChecklist } from '../shared/document-upload-checklist'
import type { DocumentItem } from '../shared/document-upload-checklist'
import type { WizardStepProps } from '../steps/types'

const DOCS: DocumentItem[] = [
  { type: 'socios_rg_cpf', label: 'RG e CPF dos sócios (frente e verso)' },
  { type: 'socios_estado_civil', label: 'Comprovante de estado civil dos sócios' },
  { type: 'socios_endereco', label: 'Comprovante de endereço dos sócios', hint: 'Últimos 3 meses' },
  { type: 'socios_ir', label: 'Declaração do IR dos sócios com recibo de entrega' },
]

type Props = WizardStepProps & { nextStep: string }

export function DocumentosPessoaisSociosStep({ proposalId, nextStep }: Props) {
  const [, startTransition] = useTransition()
  const router = useRouter()

  function handleAllUploaded() {
    startTransition(async () => {
      const res = await saveStep({ proposalId: proposalId!, stepSlug: 'documentos-pessoais-socios', stepData: { uploaded: true }, nextStep })
      if ('error' in res) return
      router.push(res.redirectTo)
    })
  }

  return <DocumentUploadChecklist proposalId={proposalId!} documents={DOCS} onAllUploaded={handleAllUploaded} />
}
