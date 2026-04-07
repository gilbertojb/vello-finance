'use client'

import { ImageIcon, Upload, X } from 'lucide-react'
import { type ChangeEvent, type DragEvent, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

type ImageUploadVariant = 'square' | 'landscape'

interface ImageUploadProps {
  name: string
  accept?: string
  maxSize?: number
  variant?: ImageUploadVariant
  currentUrl?: string | null
  hint?: string
  className?: string
}

export function ImageUpload({
  name,
  accept = 'image/*',
  maxSize,
  variant = 'landscape',
  currentUrl,
  hint,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [isDragging, setIsDragging] = useState(false)
  const [sizeError, setSizeError] = useState<string | null>(null)

  function handleFile(file: File) {
    if (maxSize && file.size > maxSize) {
      setSizeError(`Arquivo muito grande. Máximo: ${formatBytes(maxSize)}`)
      return
    }
    setSizeError(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    const dt = new DataTransfer()
    dt.items.add(file)
    if (inputRef.current) inputRef.current.files = dt.files
    handleFile(file)
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    // Only clear if leaving the drop zone itself (not a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    setPreview(null)
    setSizeError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const isSquare = variant === 'square'

  return (
    <div className={cn('space-y-1.5', className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label="Selecionar imagem"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-input hover:border-primary/40 hover:bg-muted/30',
          isSquare ? 'aspect-square' : 'aspect-video',
        )}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className={cn(
                'h-full w-full',
                isSquare ? 'object-contain p-2' : 'object-cover',
              )}
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-1.5 top-1.5 rounded-full bg-background/90 p-0.5 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
              aria-label="Remover imagem"
            >
              <X className="size-3.5" />
            </button>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-muted-foreground">
            <div className="flex size-9 items-center justify-center rounded-full border border-input bg-muted/50">
              {isDragging ? (
                <Upload className="size-4 text-primary" />
              ) : (
                <ImageIcon className="size-4" />
              )}
            </div>
            <div className="space-y-0.5 text-center">
              <p className="text-xs font-medium">
                {isDragging ? 'Solte para enviar' : 'Arraste ou clique para selecionar'}
              </p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        onChange={handleChange}
        className="sr-only"
      />

      {sizeError ? (
        <p className="text-xs text-destructive">{sizeError}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
