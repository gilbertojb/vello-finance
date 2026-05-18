'use client'

import { useTransition } from 'react'
import { saveStep } from '@/app/(store)/contratar/actions'
import { DocumentUploadChecklist } from '../shared/document-upload-checklist'
import type { DocumentItem } from '../shared/document-upload-checklist'
import type { WizardStepProps } from '../steps/types'

const DOCS_PF: DocumentItem[] = [
  { type: 'rg_cpf', label: 'RG e CPF (frente e verso)' },
  { type: 'estado_civil', label: 'Comprovante de estado civil' },
  { type: 'endereco', label: 'Comprovante de endereço', hint: 'Últimos 3 meses' },
  { type: 'ir', label: 'Declaração do IR com recibo de entrega' },
]
const DOCS_CONJUGE: DocumentItem[] = [
  { type: 'conjuge_rg_cpf', label: 'RG e CPF do cônjuge (frente e verso)' },
  { type: 'conjuge_estado_civil', label: 'Comprovante de estado civil do cônjuge' },
  { type: 'conjuge_endereco', label: 'Comprovante de endereço do cônjuge', hint: 'Últimos 3 meses' },
  { type: 'conjuge_ir', label: 'Declaração do IR do cônjuge com recibo' },
]

type Props = WizardStepProps & { nextStep: string; withCnh?: boolean }

export function DocumentosPessoaisPFStep({ proposalId, proposal, nextStep, withCnh }: Props) {
  const hasConjuge = ((proposal?.form_data as Record<string, unknown>)?.['dados-pessoais'] as Record<string, unknown> | undefined)?.['estadoCivil'] === 'casado'
  const [, startTransition] = useTransition()

  const docs: DocumentItem[] = [
    ...DOCS_PF,
    ...(withCnh ? [{ type: 'cnh', label: 'CNH (frente e verso)' }] : []),
    ...(hasConjuge ? DOCS_CONJUGE : []),
  ]

  function handleAllUploaded() {
    startTransition(async () => {
      await saveStep({ proposalId: proposalId!, stepSlug: 'documentos-pessoais', stepData: { uploaded: true }, nextStep })
    })
  }

  return <DocumentUploadChecklist proposalId={proposalId!} documents={docs} onAllUploaded={handleAllUploaded} />
}
