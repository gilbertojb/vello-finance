'use client'

import { useRef, useState, useTransition } from 'react'
import { CheckCircle2, FileUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { uploadDocumentAction } from '@/app/(store)/meus-documentos/actions'

interface Props {
  proposalId: string
  documentType: string
  label: string
  sent: boolean
}

export function DocumentUploader({ proposalId, documentType, label, sent }: Props) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(sent)
  const inputRef = useRef<HTMLInputElement | null>(null)

  function handleFile(file: File) {
    const fd = new FormData()
    fd.set('proposalId', proposalId)
    fd.set('documentType', documentType)
    fd.set('file', file)
    startTransition(async () => {
      const result = await uploadDocumentAction(fd)
      if (result?.error) toast.error(result.error)
      else { setDone(true); toast.success('Documento enviado.') }
    })
  }

  if (done) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/8 px-4 py-3">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-5 text-success" />
          <p className="text-sm font-medium text-foreground">{label}</p>
        </div>
        <span className="text-xs font-medium text-success">Enviado</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/8 px-4 py-3">
      <div className="flex items-center gap-3">
        <FileUp className="size-5 text-warning" />
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : 'Selecionar arquivo'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
        hidden
        onChange={(e) => {
          const file = e.currentTarget.files?.[0]
          if (file) handleFile(file)
          e.currentTarget.value = ''
        }}
      />
    </div>
  )
}
