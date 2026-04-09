export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function maskCnpj(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function validateCnpj(raw: string): boolean {
  const n = raw.replace(/\D/g, '')
  if (n.length !== 14 || /^(\d)\1{13}$/.test(n)) return false
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const dig = (digits: string, w: number[]) => {
    const r = w.reduce((s, v, i) => s + Number(digits[i]) * v, 0) % 11
    return r < 2 ? 0 : 11 - r
  }
  return dig(n, w1) === Number(n[12]) && dig(n, w2) === Number(n[13])
}

export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d[2]} ${d.slice(3, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return raw
}

export interface CnpjData {
  name: string
  companyName: string
  email: string
  phone: string
}

export async function fetchCnpjData(cnpj: string): Promise<CnpjData> {
  const digits = cnpj.replace(/\D/g, '')
  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
  if (!res.ok) throw new Error('CNPJ não encontrado na Receita Federal.')
  const data = await res.json() as {
    razao_social?: string
    nome_fantasia?: string
    email?: string
    ddd_telefone_1?: string
  }
  return {
    name: data.nome_fantasia?.trim() || data.razao_social?.trim() || '',
    companyName: data.razao_social?.trim() || '',
    email: data.email?.trim().toLowerCase() || '',
    phone: formatPhone(data.ddd_telefone_1 ?? ''),
  }
}

export function normalizeBranding<T>(raw: T[] | T | null | undefined): T | null {
  if (!raw) return null
  return Array.isArray(raw) ? (raw[0] ?? null) : raw
}
