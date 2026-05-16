'use client'

import {
  Activity,
  Box,
  Camera,
  HelpCircle,
  ImagePlus,
  ShieldCheck,
  Star,
} from 'lucide-react'

import Image from 'next/image'
import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Switch } from '@/components/ui/switch'

import { toggleTenantProduct, toggleTenantProductPopular, uploadProductCover } from '../actions'
import type { TenantProductRow } from '../queries'

interface ProductListProps {
  products: TenantProductRow[]
}

export function ProductList({ products }: ProductListProps) {
  const [isPending, startTransition] = useTransition()
  const [, startUploadTransition] = useTransition()
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [targetUploadId, setTargetUploadId] = useState<string | null>(null)

  function handleToggle(id: string, isActive: boolean) {
    startTransition(async () => {
      const result = await toggleTenantProduct(id, isActive)
      if (!result.success) {
        toast.error(result.message ?? 'Erro ao atualizar produto.')
      } else {
        toast.success(isActive ? 'Produto ativado!' : 'Produto desativado.')
      }
    })
  }

  function handleTogglePopular(id: string, isPopular: boolean) {
    startTransition(async () => {
      const result = await toggleTenantProductPopular(id, isPopular)
      if (!result.success) {
        toast.error(result.message ?? 'Erro ao atualizar destaque.')
      } else {
        toast.success(isPopular ? 'Produto marcado como popular!' : 'Destaque removido.')
      }
    })
  }

  function handleUploadInitiate(id: string) {
    setTargetUploadId(id)
    fileInputRef.current?.click()
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !targetUploadId) return

    const uploadId = targetUploadId
    setUploadingId(uploadId)
    const formData = new FormData()
    formData.append('cover', file)

    startUploadTransition(async () => {
      const result = await uploadProductCover(uploadId, formData)
      if (!result.success) {
        toast.error(result.message ?? 'Falha no upload da capa.')
      } else {
        toast.success(result.message)
      }
      setUploadingId(null)
      setTargetUploadId(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    })
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-muted">
          <Box className="size-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-base font-medium text-foreground">Nenhum produto alocado</h3>
        <p className="mt-2 max-w-sm text-sm text-foreground/55">
          Sua loja ainda não possui produtos alocados pelo Backoffice. Assim que
          eles forem liberados, aparecerão aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {products.map((tp) => {
        const product = tp.products
        if (!product) return null

        const isFullyActive = tp.is_active && product.is_active
        const isUploading = uploadingId === tp.id

        return (
          <div
            key={tp.id}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg ${
              !isFullyActive
                ? 'border-border/50 opacity-80 saturate-50'
                : 'border-primary/10 ring-1 ring-border/50'
            }`}
          >
            {/* Cover */}
            <div
              className={`relative flex h-40 w-full shrink-0 items-center justify-center overflow-hidden bg-muted ${!tp.cover_url ? 'bg-linear-to-br from-primary/5 to-muted' : ''}`}
            >
              {tp.cover_url ? (
                <Image
                  src={tp.cover_url}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-foreground/30">
                  <ImagePlus className="size-10" strokeWidth={1} />
                </div>
              )}

              {/* Status badges */}
              <div className="absolute left-4 top-4 flex gap-2">
                {isFullyActive ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/15 px-2.5 py-1 text-xs font-semibold text-success backdrop-blur-md">
                    <Activity className="size-3" />
                    Ativado
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-border bg-secondary/80 px-2.5 py-1 text-xs font-semibold text-foreground/70 backdrop-blur-md">
                    Oculto
                  </span>
                )}

                {!product.is_active && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-destructive/20 bg-destructive/15 px-2.5 py-1 text-xs font-semibold text-destructive backdrop-blur-md">
                    <HelpCircle className="size-3" />
                    Indisponível (IF)
                  </span>
                )}
              </div>

              {/* Upload hover overlay */}
              {isFullyActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-xl"
                    onClick={() => handleUploadInitiate(tp.id)}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <div className="size-4 animate-spin rounded-full border-2 border-foreground border-r-transparent" />
                    ) : (
                      <Camera className="size-4" />
                    )}
                    {tp.cover_url ? 'Alterar Capa' : 'Adicionar Capa'}
                  </button>
                </div>
              )}
            </div>

            {/* Header */}
            <div className="p-5 pb-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
                    {product.name}
                  </h3>
                  <p className="min-h-8 text-xs text-foreground/55 line-clamp-2">
                    {product.description ?? 'Produto financeiro base operado pela Vello.'}
                  </p>
                </div>
                <div className="shrink-0 rounded-full bg-primary/10 p-2 text-primary">
                  <ShieldCheck className="size-4" />
                </div>
              </div>
            </div>

            {/* Commission */}
            <div className="flex-1 p-5 pt-4">
              <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/40 p-3">
                <div className="flex-1 text-xs text-foreground/55">Comissão acordada</div>
                <div className="font-mono text-sm font-semibold text-foreground">
                  {Number(tp.tenant_commission_pct).toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto border-t border-border/40 bg-card">
              <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground">Visibilidade na Loja</span>
                  <span className="font-mono text-xs uppercase tracking-wider text-foreground/55">
                    {tp.is_active ? 'Catálogo aberto' : 'Oculto aos clientes'}
                  </span>
                </div>
                <Switch
                  checked={tp.is_active}
                  onCheckedChange={(checked) => handleToggle(tp.id, checked)}
                  disabled={isPending || !product.is_active}
                  title={
                    !product.is_active
                      ? 'Produto desativado pelo Backoffice'
                      : 'Alternar disponibilidade na loja'
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-border/30 px-5 pb-5 pt-3">
                <div className="flex items-center gap-2">
                  <Star className="size-3.5 text-foreground/40" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-foreground">Destaque na Loja</span>
                    <span className="font-mono text-xs uppercase tracking-wider text-foreground/55">
                      {tp.is_popular ? 'Em destaque' : 'Produto padrão'}
                    </span>
                  </div>
                </div>
                <Switch
                  checked={tp.is_popular}
                  onCheckedChange={(checked) => handleTogglePopular(tp.id, checked)}
                  disabled={isPending || !tp.is_active}
                  title="Marcar como produto popular na loja"
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
