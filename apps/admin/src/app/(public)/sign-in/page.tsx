import { SignInForm } from './sign-in-form'

export const metadata = {
  title: 'Acesse sua conta',
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="w-full max-w-sm">
      <SignInForm errorMessage={error} />
    </div>
  )
}
