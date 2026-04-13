import type { Metadata } from 'next'
import { ForgotPasswordForm } from './forgot-password-form'

export const metadata: Metadata = { title: 'Esqueceu sua senha?' }

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm className="w-full max-w-sm" />
}
