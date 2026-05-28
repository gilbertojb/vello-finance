// apps/console/src/app/(private)/proposals/[id]/_components/document-preview-modal.tsx
'use client'

import { useState, useCallback } from 'react'
import { Download, Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface DocumentPreviewModalProps {
  proposalId: string
  documentId: string
  fileName: string | null
  storagePath: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

function isImage(path: string): boolean {
  const lower = path.toLowerCase()
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export function DocumentPreviewModal({
  proposalId,
  fileName,
  storagePath,
  open,
  onOpenChange,
}: DocumentPreviewModalProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const fetchUrl = useCallback(async () => {
    if (signedUrl) return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(
        `/api/proposals/${proposalId}/document-url?path=${encodeURIComponent(storagePath)}`,
      )
      if (!res.ok) throw new Error()
      const json = await res.json() as { url: string }
      setSignedUrl(json.url)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [proposalId, storagePath, signedUrl])

  function handleOpenChange(value: boolean) {
    if (value) fetchUrl()
    else setSignedUrl(null)
    onOpenChange(value)
  }

  const displayName = fileName ?? storagePath.split('/').pop() ?? 'Documento'

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-2xl flex-col p-0 sm:max-w-2xl">
        <SheetHeader className="flex-row items-center justify-between border-b px-4 py-3">
          <SheetTitle className="truncate text-sm font-medium">{displayName}</SheetTitle>
          <div className="flex items-center gap-2">
            {signedUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={signedUrl} download={displayName} target="_blank" rel="noreferrer">
                  <Download className="mr-1.5 size-3.5" />
                  Baixar
                </a>
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex flex-1 items-center justify-center bg-muted/30 overflow-hidden">
          {loading && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <X className="size-6" />
              <span className="text-sm">Arquivo indisponível</span>
            </div>
          )}

          {signedUrl && !loading && !error && (
            isImage(storagePath) ? (
              // biome-ignore lint/performance/noImgElement: preview de documento do cliente
              <img
                src={signedUrl}
                alt={displayName}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <iframe
                src={signedUrl}
                title={displayName}
                className="h-full w-full border-0"
              />
            )
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
