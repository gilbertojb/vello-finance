import type { LeadOriginRow } from '../queries'

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

interface Props {
  rows: LeadOriginRow[]
}

export function OrigemLeadsTable({ rows }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-4 py-3 text-left font-medium text-foreground/60">Origem</th>
            <th className="px-4 py-3 text-right font-medium text-foreground/60">Leads</th>
            <th className="px-4 py-3 text-right font-medium text-foreground/60">Convertidos</th>
            <th className="px-4 py-3 text-right font-medium text-foreground/60">Taxa de conversão</th>
            <th className="px-4 py-3 text-right font-medium text-foreground/60">Volume solicitado</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-foreground/40">
                Nenhum dado encontrado.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.origin} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{row.origin}</td>
                <td className="px-4 py-3 text-right">{row.leads}</td>
                <td className="px-4 py-3 text-right">{row.converted}</td>
                <td className="px-4 py-3 text-right">{row.conversionRate}%</td>
                <td className="px-4 py-3 text-right">{brl(row.requestedVolume)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
