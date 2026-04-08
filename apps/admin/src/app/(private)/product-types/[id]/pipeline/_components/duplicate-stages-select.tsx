'use client'

import { Copy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { duplicateStagesFrom } from '../pipeline-actions'

type ProductTypeOption = { id: string; name: string }

type Props = {
  productTypeId: string
  otherProductTypes: ProductTypeOption[]
}

export function DuplicateStagesSelect({ productTypeId, otherProductTypes }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const sourceId = e.target.value
    if (!sourceId) return

    e.target.value = ''

    startTransition(async () => {
      const result = await duplicateStagesFrom(productTypeId, sourceId)
      if (result.success) {
        toast.success(result.message || 'Etapas duplicadas.')
        router.refresh()
      } else {
        toast.error(result.message || 'Erro ao duplicar etapas.')
      }
    })
  }

  if (otherProductTypes.length === 0) return null

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Copy className="size-4 shrink-0" />
      <span className="shrink-0">Duplicar etapas de:</span>
      <select
        disabled={isPending}
        onChange={handleChange}
        defaultValue=""
        className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        <option value="">Selecione um tipo...</option>
        {otherProductTypes.map((pt) => (
          <option key={pt.id} value={pt.id}>
            {pt.name}
          </option>
        ))}
      </select>
    </div>
  )
}
