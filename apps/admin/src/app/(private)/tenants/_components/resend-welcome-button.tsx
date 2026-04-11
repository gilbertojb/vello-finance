'use client'

import { Loader2, Mail } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { resendWelcomeEmail } from '../actions'

interface ResendWelcomeButtonProps {
  tenantId: string
  welcomeEmailSentAt: string | null
}

export function ResendWelcomeButton({
  tenantId,
  welcomeEmailSentAt,
}: ResendWelcomeButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleResend() {
    startTransition(async () => {
      const result = await resendWelcomeEmail(tenantId)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={handleResend}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Mail className="size-4" />
        )}
        Reenviar email de ativação
      </Button>
      <span className="text-xs text-muted-foreground">
        {welcomeEmailSentAt
          ? `Enviado em ${new Date(welcomeEmailSentAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
          : 'Email não enviado'}
      </span>
    </div>
  )
}
