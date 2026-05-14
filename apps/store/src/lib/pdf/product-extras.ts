export type PdfExtra = { label: string; value: string }

function brl(v: unknown): string {
  const n = Number(v)
  if (Number.isNaN(n)) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function pct(n: unknown): string {
  const v = Number(n)
  if (Number.isNaN(v)) return '—'
  return `${Math.round(v)}%`
}

const EXTRAS: Record<string, (d: Record<string, unknown>) => PdfExtra[]> = {
  auto_equity: (d) => [
    { label: 'Marca / Ano', value: `${String(d.marca ?? '—')} · ${String(d.ano ?? '—')}` },
    { label: 'Valor FIPE', value: brl(d.valorFipe) },
    { label: 'LTV', value: pct(Number(d.valorCredito) / Number(d.valorFipe) * 100) },
    { label: 'Uso do veículo', value: 'Permanece com você' },
  ],
  auto_equity_pj: (d) => EXTRAS.auto_equity!(d),
  home_equity: (d) => [
    { label: 'Valor do Imóvel', value: brl(d.valorImovel) },
    { label: 'Valor do Crédito', value: brl(d.valorCredito) },
    { label: 'LTV', value: pct(Number(d.valorCredito) / Number(d.valorImovel) * 100) },
  ],
  home_equity_pj: (d) => EXTRAS.home_equity!(d),
  fgts: (d) => [
    { label: 'Saldo FGTS', value: brl(d.saldoFgts) },
    { label: 'Crédito disponível', value: brl(Number(d.saldoFgts) * 0.75) },
    { label: 'Prazo', value: '120 meses' },
  ],
  financiamento_imovel: (d) => [
    { label: 'Valor do Imóvel', value: brl(d.valorImovel) },
    { label: 'Entrada', value: brl(d.entrada) },
    { label: '% de Entrada', value: pct(Number(d.entrada) / Number(d.valorImovel) * 100) },
  ],
  financiamento_veiculo: (d) => [
    { label: 'Valor do Veículo', value: brl(d.valorVeiculo) },
    { label: 'Entrada', value: brl(d.entrada) },
    { label: '% de Entrada', value: pct(Number(d.entrada) / Number(d.valorVeiculo) * 100) },
  ],
  conta_luz: (d) => [
    { label: 'Distribuidora', value: String(d.distribuidora ?? '—') },
    { label: 'Valor solicitado', value: brl(d.valorDesejado) },
  ],
}

export function getProductExtras(
  slug: string,
  data: Record<string, unknown>,
): PdfExtra[] {
  const fn = EXTRAS[slug]
  if (!fn) return []
  try {
    return fn(data)
  } catch {
    return []
  }
}
