import { SignInForm } from './sign-in-form'

export const metadata = {
  title: 'Acesse sua conta',
}

export default function SignInPage() {
  return (
    <div className="w-full max-w-sm">
      <SignInForm />
    </div>
  )
}
