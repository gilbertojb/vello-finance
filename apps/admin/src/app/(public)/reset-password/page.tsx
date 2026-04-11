import { ResetPasswordForm } from './reset-password-form'

export const metadata = {
  title: 'Redefinir senha',
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <ResetPasswordForm />
    </div>
  )
}
