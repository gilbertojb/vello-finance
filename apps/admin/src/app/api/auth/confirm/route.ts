import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/reset-password'

  const supabase = await createClient()
  let error: Error | null = null

  if (token && type) {
    // Token hash gerado por auth.admin.generateLink() — verificar via verifyOtp
    const result = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as 'recovery' | 'email',
    })
    error = result.error
  } else if (code) {
    // PKCE code — trocar por sessão
    const result = await supabase.auth.exchangeCodeForSession(code)
    error = result.error
  } else {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  if (error) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    url.search = ''
    url.searchParams.set('error', 'Link expirado ou inválido. Solicite um novo.')
    return NextResponse.redirect(url)
  }

  const url = request.nextUrl.clone()
  url.pathname = next
  url.search = ''
  return NextResponse.redirect(url)
}
