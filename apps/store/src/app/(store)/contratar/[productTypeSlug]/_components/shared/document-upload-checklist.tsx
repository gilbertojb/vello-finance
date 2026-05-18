'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { uploadDocument } from '@/app/(store)/contratar/actions'

export type DocumentItem = {
  type: string
  label: string
  hint?: string
  accept?: 'pdf' | 'jpeg' | 'both'
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

type Props = {
  proposalId: string
  documents: DocumentItem[]
  onAllUploaded: () => void
}

export function DocumentUploadChecklist({ proposalId, documents, onAllUploaded }: Props) {
  const [states, setStates] = useState<Record<string, UploadState>>(
    Object.fromEntries(documents.map((d) => [d.type, 'idle'])),
  )
  const [fileNames, setFileNames] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const allDone = documents.every((d) => states[d.type] === 'done')

  function acceptAttr(item: DocumentItem): string {
    if (item.accept === 'pdf') return '.pdf'
    if (item.accept === 'jpeg') return '.jpg,.jpeg'
    return '.pdf,.jpg,.jpeg'
  }

  function handleFileChange(item: DocumentItem, file: File | null) {
    if (!file) return
    setStates((prev) => ({ ...prev, [item.type]: 'uploading' }))
    setErrors((prev) => ({ ...prev, [item.type]: '' }))

    const fd = new FormData()
    fd.set('file', file)

    startTransition(async () => {
      const result = await uploadDocument(proposalId, item.type, fd)
      if ('error' in result) {
        setStates((prev) => ({ ...prev, [item.type]: 'error' }))
        setErrors((prev) => ({ ...prev, [item.type]: result.error }))
      } else {
        setStates((prev) => ({ ...prev, [item.type]: 'done' }))
        setFileNames((prev) => ({ ...prev, [item.type]: file.name }))
      }
    })
  }

  return (
    <div className="space-y-3">
      {documents.map((item) => {
        const state = states[item.type]
        const isDone = state === 'done'
        const isError = state === 'error'
        const isUploading = state === 'uploading'

        return (
          <div
            key={item.type}
            className={`rounded-lg border p-4 transition-colors ${
              isDone ? 'border-green-500/30 bg-green-50/50' : isError ? 'border-destructive/30 bg-destructive/5' : 'bg-background'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <div className={`h-5 w-5 rounded-full border-2 ${isError ? 'border-destructive' : 'border-border'}`} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.label}</p>
                {item.hint && <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>}
                {isDone && fileNames[item.type] && (
                  <p className="mt-1 truncate text-xs text-green-600">{fileNames[item.type]}</p>
                )}
                {isError && errors[item.type] && (
                  <FieldError className="mt-1">{errors[item.type]}</FieldError>
                )}
              </div>

              <label className="flex-shrink-0 cursor-pointer">
                <Button
                  type="button"
                  variant={isDone ? 'outline' : 'ghost'}
                  size="sm"
                  disabled={isUploading}
                  asChild
                >
                  <span>
                    <input
                      type="file"
                      className="sr-only"
                      accept={acceptAttr(item)}
                      disabled={isUploading}
                      onChange={(e) => handleFileChange(item, e.target.files?.[0] ?? null)}
                    />
                    {isUploading ? '…' : isDone ? 'Trocar' : 'Enviar'}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        )
      })}

      <Button
        type="button"
        className="mt-4 w-full"
        disabled={!allDone || isPending}
        onClick={onAllUploaded}
      >
        {isPending ? 'Finalizando…' : 'Finalizar Envio'}
      </Button>
    </div>
  )
}
