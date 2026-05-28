// apps/console/src/app/(private)/proposals/[id]/_components/client-data-tab.tsx
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { ProposalDetail } from '../../queries'

function brlFull(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatLabel(key: string): string {
  const LABELS: Record<string, string> = {
    nome_completo:        'Nome completo',
    cpf:                  'CPF',
    rg:                   'RG',
    data_nascimento:      'Data de nascimento',
    email:                'E-mail',
    whatsapp:             'WhatsApp',
    nome_mae:             'Nome da mãe',
    tipo_ocupacao:        'Tipo de ocupação',
    renda_mensal:         'Renda mensal',
    tempo_ocupacao:       'Tempo na ocupação',
    tipo_veiculo:         'Tipo de veículo',
    placa:                'Placa',
    ano_fabricacao:       'Ano de fabricação',
    motivo_credito:       'Motivo do crédito',
    banco:                'Banco',
    agencia:              'Agência',
    conta:                'Conta-corrente',
    pix:                  'Chave PIX',
    financiado:           'Veículo financiado?',
  }
  return LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

interface FieldItemProps {
  label: string
  value: string
  full?: boolean
}

function FieldItem({ label, value, full }: FieldItemProps) {
  return (
    <div className={cn(
      'rounded-md border border-border/60 bg-muted/50 px-3 py-2',
      full && 'col-span-2',
    )}>
      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{value || '—'}</p>
    </div>
  )
}

interface ClientDataTabProps {
  proposal: ProposalDetail
}

export function ClientDataTab({ proposal }: ClientDataTabProps) {
  const simulation = Array.isArray(proposal.simulations)
    ? proposal.simulations[0]
    : proposal.simulations

  const formData = (proposal.form_data ?? {}) as Record<string, unknown>

  const personalKeys = ['nome_completo','cpf','rg','data_nascimento','email','whatsapp','nome_mae']
  const personalEntries = personalKeys
    .filter((k) => formData[k] != null)
    .map((k) => ({ key: k, label: formatLabel(k), value: String(formData[k]) }))

  const excludedKeys = new Set([
    ...personalKeys,
    'banco','agencia','conta','pix','confirmacao_titularidade',
  ])
  const operationEntries = Object.entries(formData)
    .filter(([k]) => !excludedKeys.has(k))
    .map(([k, v]) => ({ key: k, label: formatLabel(k), value: String(v ?? '') }))

  return (
    <div className="space-y-5">
      {personalEntries.length > 0 && (
        <section>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Dados Pessoais
          </p>
          <div className="grid grid-cols-2 gap-2">
            {personalEntries.map(({ key, label, value }) => (
              <FieldItem
                key={key}
                label={label}
                value={value}
                full={key === 'email' || key === 'nome_completo'}
              />
            ))}
          </div>
        </section>
      )}

      {(personalEntries.length > 0 || operationEntries.length > 0) && simulation && (
        <Separator />
      )}

      {(operationEntries.length > 0 || simulation) && (
        <section>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Operação
          </p>
          <div className="grid grid-cols-2 gap-2">
            {simulation && (
              <>
                <FieldItem
                  label="Valor solicitado"
                  value={brlFull(Number(simulation.desired_amount))}
                />
                <FieldItem
                  label="Prazo"
                  value={`${simulation.desired_term_months} meses`}
                />
                {simulation.estimated_payment && (
                  <FieldItem
                    label="Parcela estimada"
                    value={brlFull(Number(simulation.estimated_payment))}
                  />
                )}
                {simulation.estimated_rate && (
                  <FieldItem
                    label="Taxa estimada"
                    value={`${Number(simulation.estimated_rate).toFixed(2)}% a.m.`}
                  />
                )}
              </>
            )}
            {operationEntries.map(({ key, label, value }) => (
              <FieldItem key={key} label={label} value={value} />
            ))}
          </div>
        </section>
      )}

      {personalEntries.length === 0 && operationEntries.length === 0 && !simulation && (
        <p className="text-sm text-muted-foreground">Dados não disponíveis.</p>
      )}
    </div>
  )
}
