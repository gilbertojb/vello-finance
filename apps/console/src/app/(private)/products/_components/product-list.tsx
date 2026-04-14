'use client'

import {
  Activity,
  Box,
  Camera,
  HelpCircle,
  ImagePlus,
  ShieldCheck,
} from 'lucide-react'

import Image from 'next/image'
import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

import { toggleTenantProduct, uploadProductCover } from '../actions'
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
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Box className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-foreground">
          Nenhum produto alocado
        </h3>
        <p className="mt-2 text-sm text-muted-foreground w-full max-w-[380px]">
          Sua loja ainda não possui produtos alocados pelo Backoffice. Assim que
          eles forem liberados, aparecerão aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Hidden file input for cover upload */}
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
          <Card
            key={tp.id}
            className={`group relative flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg ${
              !isFullyActive
                ? 'opacity-80 saturate-50'
                : 'ring-1 ring-border/50'
            }`}
          >
            {/* Visual Cover Area */}
            <div
              className={`relative h-40 w-full shrink-0 overflow-hidden bg-muted flex items-center justify-center ${!tp.cover_url && 'bg-linear-to-br from-primary/5 to-muted'}`}
            >
              {tp.cover_url ? (
                <Image
                  src={tp.cover_url}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="text-muted-foreground/30 flex flex-col items-center gap-2">
                  <ImagePlus className="size-10" strokeWidth={1} />
                </div>
              )}

              {/* Status Badge Overlays */}
              <div className="absolute top-4 left-4 flex gap-2">
                {isFullyActive ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20 gap-1 backdrop-blur-md">
                    <Activity className="size-3" />
                    Ativado
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="backdrop-blur-md bg-secondary/80"
                  >
                    Oculto
                  </Badge>
                )}

                {!product.is_active && (
                  <Badge
                    variant="destructive"
                    className="backdrop-blur-md gap-1"
                  >
                    <HelpCircle className="size-3" />
                    Indisponível (IF)
                  </Badge>
                )}
              </div>

              {/* Hover Actions (Upload Custom Cover) */}
              {isFullyActive && (
                <div className="absolute inset-0 bg-background/40 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="shadow-xl font-medium gap-2"
                    onClick={() => handleUploadInitiate(tp.id)}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <div className="size-4 animate-spin rounded-full border-2 border-foreground border-r-transparent" />
                    ) : (
                      <Camera className="size-4" />
                    )}
                    {tp.cover_url ? 'Alterar Capa' : 'Adicionar Capa'}
                  </Button>
                </div>
              )}
            </div>

            <CardHeader className="p-5 pb-0">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg leading-tight tracking-tight">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                    {product.description ??
                      'Produto financeiro base operado pela Vello.'}
                  </p>
                </div>
                {/* Visual indicator of partnership */}
                <div className="rounded-full bg-primary/10 p-2 text-primary shrink-0">
                  <ShieldCheck className="size-4" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-4 flex-1">
              <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-3 border border-border/40">
                <div className="text-xs text-muted-foreground flex-1">
                  Comissão acordada
                </div>
                <div className="font-mono text-sm font-semibold text-foreground">
                  {Number(tp.tenant_commission_pct).toFixed(2)}%
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-5 pt-0 flex items-center justify-between border-t border-border/40 bg-card mt-auto gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground">
                  Visibilidade na Loja
                </span>
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
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
                className="data-[state=checked]:bg-emerald-500"
              />
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
