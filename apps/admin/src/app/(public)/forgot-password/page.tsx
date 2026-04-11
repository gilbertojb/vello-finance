import { ForgotPasswordForm } from './forgot-password-form'

export const metadata = {
  title: 'Esqueceu sua senha?',
}

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <ForgotPasswordForm />
    </div>
  )
}
