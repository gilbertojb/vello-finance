'use client'

import { useState } from 'react'
import { Copy, MessageCircle, Send } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  portalUrl: string
  pendingCount: number
  clientName: string | null
  clientPhone: string | null
}

function buildWhatsappUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function ClientShareCard({ portalUrl, pendingCount, clientName, clientPhone }: Props) {
  const [copied, setCopied] = useState(false)
  const greeting = clientName ? `Olá ${clientName}!` : 'Olá!'
  const message = `${greeting} Você tem ${pendingCount} documento${pendingCount > 1 ? 's' : ''} pendente${pendingCount > 1 ? 's' : ''} em sua proposta. Acesse: ${portalUrl}`

  async function copy() {
    await navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    toast.success('Link copiado.')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Send className="size-4" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">Enviar link ao cliente</p>
          <p className="text-xs text-muted-foreground">
            O cliente acessa esta página com o CPF dele e envia os {pendingCount} documentos pendentes diretamente.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
        <p className="flex-1 truncate text-xs font-mono text-muted-foreground">{portalUrl}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={copy}>
          <Copy className="size-3.5" />
          {copied ? 'Copiado' : 'Copiar link'}
        </Button>

        {clientPhone ? (
          <Button asChild variant="outline" size="sm">
            <a
              href={buildWhatsappUrl(clientPhone, message)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-3.5" />
              Enviar via WhatsApp
            </a>
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="outline" size="sm" disabled>
                  <MessageCircle className="size-3.5" />
                  Enviar via WhatsApp
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Telefone do cliente não cadastrado</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
