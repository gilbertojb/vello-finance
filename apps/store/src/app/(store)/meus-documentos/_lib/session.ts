// TODO Futuro: Passwordless — substituir validação por CPF apenas por OTP via SMS/email
// ou senha. Quando implementarmos, manter rate-limit e estrutura de sessão; trocar
// apenas o "fator" (CPF → OTP/senha). A coluna client_cpf_hash continua útil como
// chave entre identidade autenticada e propostas existentes.

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'vello_client_session'
const COOKIE_PATH = '/meus-documentos'
const DEFAULT_EXPIRES_SECONDS = 30 * 60

interface ClientSessionPayload {
  cpf_hash: string
  tenant_id: string
  cpf_display?: string
}

function getSecret(): Uint8Array {
  const secret = process.env.CLIENT_SESSION_SECRET
  if (!secret) throw new Error('CLIENT_SESSION_SECRET missing')
  return new TextEncoder().encode(secret)
}

export async function signClientSession(
  payload: ClientSessionPayload,
  opts: { expiresInSeconds?: number } = {},
): Promise<string> {
  const exp = opts.expiresInSeconds ?? DEFAULT_EXPIRES_SECONDS
  return new SignJWT({ cpf_hash: payload.cpf_hash, tenant_id: payload.tenant_id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + exp)
    .sign(getSecret())
}

export async function verifyClientSession(
  token: string,
  expectedTenantId: string,
): Promise<ClientSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] })
    if (typeof payload.cpf_hash !== 'string' || typeof payload.tenant_id !== 'string') return null
    if (payload.tenant_id !== expectedTenantId) return null
    return { cpf_hash: payload.cpf_hash, tenant_id: payload.tenant_id }
  } catch {
    return null
  }
}

export async function setClientSessionCookie(token: string): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: COOKIE_PATH,
    maxAge: DEFAULT_EXPIRES_SECONDS,
  })
}

export async function clearClientSessionCookie(): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: COOKIE_PATH,
    maxAge: 0,
  })
}

export async function readClientSession(expectedTenantId: string): Promise<ClientSessionPayload | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyClientSession(token, expectedTenantId)
}
