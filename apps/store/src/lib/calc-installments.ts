export type PriceInstallment = {
  n: number
  juros: number
  amortizacao: number
  saldoDevedor: number
}

export type SacInstallment = {
  n: number
  amortizacao: number
  juros: number
  valorParcela: number
  saldoDevedor: number
}

export function calcPriceSchedule(
  principal: number,
  monthlyRatePct: number,
  months: number,
): PriceInstallment[] {
  const r = monthlyRatePct / 100
  if (r === 0) {
    const amort = principal / months
    return Array.from({ length: months }, (_, i) => ({
      n: i + 1,
      juros: 0,
      amortizacao: amort,
      saldoDevedor: Math.max(0, principal - amort * (i + 1)),
    }))
  }
  const pmt = (principal * (r * Math.pow(1 + r, months))) / (Math.pow(1 + r, months) - 1)
  const result: PriceInstallment[] = []
  let saldo = principal
  for (let i = 0; i < months; i++) {
    const juros = saldo * r
    const amortizacao = pmt - juros
    saldo = Math.max(0, saldo - amortizacao)
    result.push({ n: i + 1, juros, amortizacao, saldoDevedor: saldo })
  }
  return result
}

export function calcSacSchedule(
  principal: number,
  monthlyRatePct: number,
  months: number,
): SacInstallment[] {
  const r = monthlyRatePct / 100
  const amortizacao = principal / months
  const result: SacInstallment[] = []
  let saldo = principal
  for (let i = 0; i < months; i++) {
    const juros = saldo * r
    const valorParcela = amortizacao + juros
    saldo = Math.max(0, saldo - amortizacao)
    result.push({ n: i + 1, amortizacao, juros, valorParcela, saldoDevedor: saldo })
  }
  return result
}
