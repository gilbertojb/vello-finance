// apps/console/src/app/(private)/proposals/[id]/_components/documents-tab.tsx
'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, Eye, FileText, Image } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getRequiredDocs } from '@vello/proposals-shared/required-documents'
import { DocumentPreviewModal } from './document-preview-modal'
import type { ProposalDetail } from '@/app/(private)/proposals/queries'

type UploadedDoc = NonNullable<ProposalDetail['proposal_documents']>[number]

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
function isImage(path: string): boolean {
  const lower = (path ?? '').toLowerCase()
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

interface DocumentsTabProps {
  proposal: ProposalDetail
}

export function DocumentsTab({ proposal }: DocumentsTabProps) {
  const [preview, setPreview] = useState<{
    docId: string
    fileName: string | null
    storagePath: string
  } | null>(null)

  const uploaded: UploadedDoc[] = Array.isArray(proposal.proposal_documents)
    ? proposal.proposal_documents
    : proposal.proposal_documents ? [proposal.proposal_documents] : []

  const required = getRequiredDocs(proposal.product_type_slug)
  const uploadedTypes = new Set(uploaded.map((d) => d.document_type))

  const pendingDocs = required.filter((r) => !uploadedTypes.has(r.type))
  const sentCount = uploaded.length
  const pendingCount = pendingDocs.length

  return (
    <>
      {/* Resumo */}
      <div className="mb-4 flex gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-success/8 px-2.5 py-1 text-xs font-medium text-success">
          <CheckCircle2 className="size-3" />
          {sentCount} enviado{sentCount !== 1 ? 's' : ''}
        </span>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
            <Clock className="size-3" />
            {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {/* Documentos enviados */}
        {uploaded.map((doc) => {
          const icon = isImage(doc.storage_path)
            ? <Image className="size-4 text-success" />
            : <FileText className="size-4 text-success" />

          return (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-lg border border-success/25 bg-success/6 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="grid size-8 shrink-0 place-items-center rounded-md bg-success/12">
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{doc.file_name ?? doc.document_type}</p>
                  <p className="text-xs text-muted-foreground">
                    Enviado {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="ml-2 flex shrink-0 items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() =>
                        setPreview({
                          docId: doc.id,
                          fileName: doc.file_name,
                          storagePath: doc.storage_path,
                        })
                      }
                    >
                      <Eye className="size-3" />
                      Visualizar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Abrir pré-visualização</TooltipContent>
                </Tooltip>
              </div>
            </div>
          )
        })}

        {/* Documentos pendentes */}
        {pendingDocs.map((doc) => (
          <div
            key={doc.type}
            className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 shrink-0 place-items-center rounded-md bg-warning/15">
                <FileText className="size-4 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-warning">{doc.label}</p>
                <p className="text-xs text-muted-foreground">Não enviado pelo cliente</p>
              </div>
            </div>
            <Badge variant="outline" className="border-warning/30 text-warning text-xs">
              Pendente
            </Badge>
          </div>
        ))}

        {/* Estado vazio */}
        {uploaded.length === 0 && required.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Este produto não requer envio de documentos.
          </p>
        )}
      </div>

      {/* Modal de preview */}
      {preview && (
        <DocumentPreviewModal
          proposalId={proposal.id}
          documentId={preview.docId}
          fileName={preview.fileName}
          storagePath={preview.storagePath}
          open={!!preview}
          onOpenChange={(open) => { if (!open) setPreview(null) }}
        />
      )}
    </>
  )
}
