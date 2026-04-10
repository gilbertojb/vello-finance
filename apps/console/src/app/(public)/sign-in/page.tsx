import type { Metadata } from 'next'
import { SignInForm } from './sign-in-form'

export const metadata: Metadata = { title: 'Acesse sua conta' }

export default function SignInPage() {
  return <SignInForm className="w-full max-w-sm" />
}
