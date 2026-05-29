import type { SalesOriginRow } from '../queries'

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

interface Props {
  rows: SalesOriginRow[]
}

export function OrigemVendasTable({ rows }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-4 py-3 text-left font-medium text-foreground/60">Origem</th>
            <th className="px-4 py-3 text-right font-medium text-foreground/60">Propostas aprovadas</th>
            <th className="px-4 py-3 text-right font-medium text-foreground/60">Volume contratado</th>
            <th className="px-4 py-3 text-right font-medium text-foreground/60">Comissão gerada</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-10 text-center text-foreground/40">
                Nenhum dado encontrado.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.origem} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{row.origem}</td>
                <td className="px-4 py-3 text-right">{row.propostasAprovadas}</td>
                <td className="px-4 py-3 text-right">{brl(row.volumeContratado)}</td>
                <td className="px-4 py-3 text-right">{brl(row.comissaoGerada)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
