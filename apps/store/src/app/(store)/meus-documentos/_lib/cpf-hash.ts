import { createHash } from 'node:crypto'

function getPepper(): string {
  const pepper = process.env.SUPABASE_CPF_PEPPER
  if (!pepper) throw new Error('SUPABASE_CPF_PEPPER missing')
  return pepper
}

function sha256Hex(input: string, namespace: string): string {
  return createHash('sha256').update(`${namespace}:${input}:${getPepper()}`).digest('hex')
}

export function hashCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  return sha256Hex(digits, 'cpf')
}

export function hashIp(ip: string): string {
  return sha256Hex(ip, 'ip')
}

export function hashUserAgent(ua: string): string {
  return sha256Hex(ua, 'ua')
}
