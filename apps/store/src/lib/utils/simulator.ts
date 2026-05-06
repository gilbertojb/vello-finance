/** Gera até 5 opções de prazo em intervalos de 12 meses. */
export function generateTermOptions(min: number, max: number): number[] {
  if (min === max) return [min]

  const byStep: number[] = []
  for (let t = min; t <= max; t += 12) byStep.push(t)
  if (byStep[byStep.length - 1] !== max) byStep.push(max)

  if (byStep.length <= 5) return byStep

  const result = [min]
  const interval = (max - min) / 4
  for (let i = 1; i < 4; i++) {
    result.push(Math.round((min + interval * i) / 12) * 12)
  }
  result.push(max)
  return result
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatRate(rate: number): string {
  return rate.toFixed(2).replace('.', ',')
}
