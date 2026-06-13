// apps/console/src/app/(private)/proposals/[id]/_components/client-data-tab.tsx
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { ProposalDetail } from '@/app/(private)/proposals/queries'

function brlFull(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatLabel(key: string): string {
  const LABELS: Record<string, string> = {
    // snake_case (legado)
    nome_completo:            'Nome completo',
    cpf:                      'CPF',
    rg:                       'RG',
    data_nascimento:          'Data de nascimento',
    email:                    'E-mail',
    whatsapp:                 'WhatsApp',
    nome_mae:                 'Nome da mãe',
    tipo_ocupacao:            'Tipo de ocupação',
    renda_mensal:             'Renda mensal',
    tempo_ocupacao:           'Tempo na ocupação',
    tipo_veiculo:             'Tipo de veículo',
    placa:                    'Placa',
    ano_fabricacao:           'Ano de fabricação',
    motivo_credito:           'Motivo do crédito',
    banco:                    'Banco',
    agencia:                  'Agência',
    conta:                    'Conta-corrente',
    pix:                      'Chave PIX',
    financiado:               'Financiado?',
    // camelCase (wizard store)
    nomeCompleto:             'Nome completo',
    dataNascimento:           'Data de nascimento',
    nomeMae:                  'Nome da mãe',
    tipoOcupacao:             'Tipo de ocupação',
    rendaMensal:              'Renda mensal',
    tempoOcupacao:            'Tempo na ocupação',
    tipoVeiculo:              'Tipo de veículo',
    anoFabricacao:            'Ano de fabricação',
    tipoComprador:            'Tipo de comprador',
    tipoImovel:               'Tipo de imóvel',
    tipoRecebivel:            'Tipo de recebível',
    faturamento:              'Faturamento (12 meses)',
    fundacao:                 'Abertura do CNPJ',
    motivo:                   'Motivo do crédito',
    valorPago:                'Valor pago',
    matricula:                'Matrícula',
    tipoContrato:             'Tipo de contrato',
    tempoEmpresa:             'Tempo de empresa',
    empresa:                  'Empresa',
    estadoCivil:              'Estado civil',
    autorizado:               'Autorizado',
    clt:                      'CLT',
    vinculo:                  'Vínculo ativo',
    tempo:                    'Tempo de empresa',
    idade:                    'Faixa de idade',
    composicaoRenda:          'Composição de renda',
    rendaComplementar:        'Renda complementar',
    tipoGarantia:             'Tipo de garantia',
    valorImovel:              'Valor do imóvel',
    valorVeiculo:             'Valor do veículo',
    confirmacaoTitularidade:  'Confirmação de titularidade',
    agenciaDv:                'Agência DV',
    contaDv:                  'Conta DV',
    tipoConta:                'Tipo de conta',
    valorCredito:             'Valor de crédito',
    valorRecebiveis:          'Total de recebíveis',
    valorDesejado:            'Valor desejado',
    modelo:                   'Modelo',
    cnpj:                     'CNPJ',
    razaoSocial:              'Razão social',
    nomeFantasia:             'Nome fantasia',
    naturezaJuridica:         'Natureza jurídica',
    regimeTributario:         'Regime tributário',
    atividadePrincipal:       'Atividade principal',
  }
  if (LABELS[key]) return LABELS[key]
  // camelCase → "Camel Case"
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não'
  if (Array.isArray(v)) return v.map((i) => formatValue(i)).join(', ')
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
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

  const rawFormData = (proposal.form_data ?? {}) as Record<string, unknown>
  const formData: Record<string, unknown> = {}
  for (const stepData of Object.values(rawFormData)) {
    if (stepData && typeof stepData === 'object' && !Array.isArray(stepData)) {
      Object.assign(formData, stepData)
    }
  }

  const personalKeys = ['nome_completo','nomeCompleto','cpf','rg','data_nascimento','dataNascimento','email','whatsapp','nome_mae','nomeMae']
  const seenPersonalLabels = new Set<string>()
  const personalEntries = personalKeys
    .filter((k) => formData[k] != null)
    .reduce<{ key: string; label: string; value: string }[]>((acc, k) => {
      const label = formatLabel(k)
      if (!seenPersonalLabels.has(label)) {
        seenPersonalLabels.add(label)
        acc.push({ key: k, label, value: formatValue(formData[k]) })
      }
      return acc
    }, [])

  const excludedKeys = new Set([
    ...personalKeys,
    'banco','agencia','conta','pix','confirmacao_titularidade',
  ])
  const operationEntries = Object.entries(formData)
    .filter(([k]) => !excludedKeys.has(k))
    .map(([k, v]) => ({ key: k, label: formatLabel(k), value: formatValue(v) }))

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
                full={key === 'email' || key === 'nome_completo' || key === 'nomeCompleto'}
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
