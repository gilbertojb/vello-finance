import type { Metadata } from 'next'
import Link from 'next/link'

import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = { title: 'Redefinir senha' }

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string; type?: string }>
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token, type } = await searchParams

  if (!token || type !== 'recovery') {
    return (
      <div className="w-full max-w-sm flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Link inválido ou expirado
        </h1>
        <p className="text-muted-foreground text-sm text-balance">
          Este link de redefinição de senha não é válido ou já expirou.
        </p>
        <Link
          href="/forgot-password"
          className="text-primary hover:text-primary/80 text-sm underline"
        >
          Solicitar novo link
        </Link>
      </div>
    )
  }

  return (
    <ResetPasswordForm token={token} type={type} className="w-full max-w-sm" />
  )
}
