// Executar com: pnpm tsx scripts/backfill-cpf-hash.ts
// Requer SUPABASE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL e SUPABASE_CPF_PEPPER no env.
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY
const pepper = process.env.SUPABASE_CPF_PEPPER

if (!url || !key || !pepper) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_CPF_PEPPER')
  process.exit(1)
}

function validateCPF(raw: string): boolean {
  const d = raw.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  const calc = (len: number) => {
    let s = 0
    for (let i = 0; i < len; i++) s += Number(d[i]) * (len + 1 - i)
    const r = 11 - (s % 11)
    return r >= 10 ? 0 : r
  }
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10])
}

function hashCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  return createHash('sha256').update(`cpf:${digits}:${pepper}`).digest('hex')
}

function extractCpf(formData: Record<string, unknown> | null): string | null {
  if (!formData) return null
  for (const value of Object.values(formData)) {
    if (value && typeof value === 'object' && 'cpf' in value) {
      const raw = (value as { cpf?: unknown }).cpf
      if (typeof raw === 'string') {
        const digits = raw.replace(/\D/g, '')
        if (validateCPF(digits)) return digits
      }
    }
  }
  return null
}

async function main() {
  const supabase = createClient(url!, key!)
  const pageSize = 500
  let processed = 0
  let updated = 0
  let skipped = 0

  while (true) {
    const { data, error } = await supabase
      .from('proposals')
      .select('id, form_data')
      .is('client_cpf_hash', null)
      .order('created_at', { ascending: true })
      .limit(pageSize)

    if (error) {
      console.error('Query error:', error)
      process.exit(1)
    }
    if (!data || data.length === 0) break

    for (const row of data) {
      processed++
      const cpf = extractCpf(row.form_data as Record<string, unknown> | null)
      if (!cpf) {
        skipped++
        continue
      }
      const { error: updErr } = await supabase
        .from('proposals')
        .update({ client_cpf_hash: hashCpf(cpf) })
        .eq('id', row.id)
      if (updErr) {
        console.error(`Failed update ${row.id}:`, updErr)
        skipped++
        continue
      }
      updated++
    }

    if (data.length < pageSize) break
  }

  console.log(`Backfill done: processed=${processed} updated=${updated} skipped=${skipped}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
