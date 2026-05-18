import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { getProductExtras } from './product-extras'
import { oklchToHex } from './oklch-to-rgb'
import type { PriceInstallment } from '@/lib/calc-installments'

type Extra = { label: string; value: string }

export type SimulationPdfProps = {
  simulationId: string
  clientName: string
  productName: string
  productSlug: string
  desiredAmount: number
  desiredTermMonths: number
  estimatedRate: number | null
  estimatedPayment: number | null
  simulationData: Record<string, unknown>
  createdAt: string
  companyName: string
  logoUrl: string | null
  primaryL: number
  primaryC: number
  primaryH: number
  sistema: 'PRICE' | null
  installments: PriceInstallment[]
}

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const months = [
    'janeiro','fevereiro','março','abril','maio','junho',
    'julho','agosto','setembro','outubro','novembro','dezembro',
  ]
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`
}

function primaryLight(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const mix = (c: number) => Math.round(c * 0.12 + 255 * 0.88)
  return `#${mix(r).toString(16).padStart(2, '0')}${mix(g).toString(16).padStart(2, '0')}${mix(b).toString(16).padStart(2, '0')}`
}

export function SimulationPdf({
  simulationId,
  clientName,
  productName,
  productSlug,
  desiredAmount,
  desiredTermMonths,
  estimatedRate,
  estimatedPayment,
  simulationData,
  createdAt,
  companyName,
  logoUrl,
  primaryL,
  primaryC,
  primaryH,
  sistema,
  installments,
}: SimulationPdfProps) {
  const primary = oklchToHex(primaryL, primaryC, primaryH)
  const primaryBg = primaryLight(primary)
  const extras: Extra[] = getProductExtras(productSlug, simulationData)
  const shortId = simulationId.slice(0, 8)
  const dateStr = formatDate(createdAt)
  const rateStr = estimatedRate != null
    ? `${estimatedRate.toFixed(2).replace('.', ',')}% a.m.`
    : '—'
  const paymentStr = estimatedPayment != null && estimatedPayment > 0 ? brl(estimatedPayment) : '—'
  const cetAnual = estimatedRate != null
    ? `${((Math.pow(1 + estimatedRate / 100, 12) - 1) * 100).toFixed(1).replace('.', ',')}% a.a.`
    : '—'

  const s = StyleSheet.create({
    page: { backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
    accentBar: { height: 4, backgroundColor: primary },
    content: { paddingHorizontal: 36, paddingTop: 14, paddingBottom: 32 },

    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 14,
    },
    logoImage: { height: 26, objectFit: 'contain' },
    logoFallback: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: primary },
    headerRight: { alignItems: 'flex-end' },
    headerLabel: { fontSize: 8, color: '#9ca3af', letterSpacing: 0.8, textTransform: 'uppercase' },
    headerDate: { fontSize: 9, color: '#6b7280', marginTop: 2 },

    badge: {
      backgroundColor: primary, borderRadius: 4,
      paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6,
    },
    badgeText: { fontSize: 8, color: '#ffffff', fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
    clientName: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 14, letterSpacing: -0.3 },

    resultBox: {
      borderWidth: 1, borderColor: '#e5e7eb', borderLeftWidth: 4, borderLeftColor: primary,
      borderRadius: 6, padding: 14, flexDirection: 'row',
      justifyContent: 'space-between', alignItems: 'flex-end',
      marginBottom: 12, backgroundColor: primaryBg,
    },
    resultLabel: { fontSize: 8, color: '#6b7280', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 },
    resultValue: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
    resultSub: { fontSize: 8, color: '#6b7280', marginTop: 3 },
    resultSecLabel: { fontSize: 8, color: '#6b7280', textAlign: 'right', marginBottom: 2 },
    resultSecValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#0f172a', textAlign: 'right' },

    metricsRow: { flexDirection: 'row', marginBottom: 14 },
    metricCell: {
      flex: 1, backgroundColor: '#f9fafb', borderRadius: 5, padding: 9,
      borderWidth: 1, borderColor: '#e5e7eb', marginRight: 6,
    },
    metricCellLast: {
      flex: 1, backgroundColor: '#f9fafb', borderRadius: 5, padding: 9,
      borderWidth: 1, borderColor: '#e5e7eb',
    },
    metricLabel: { fontSize: 7, color: '#9ca3af', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 },
    metricValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#0f172a' },

    dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
    dividerText: {
      fontSize: 7, color: '#9ca3af', fontFamily: 'Helvetica-Bold',
      letterSpacing: 1, marginHorizontal: 8, textTransform: 'uppercase',
    },

    extrasGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
    extraCell: {
      width: '48%', borderWidth: 1, borderColor: '#e5e7eb',
      borderRadius: 5, padding: 8, marginRight: '2%', marginBottom: 6,
    },
    extraLabel: { fontSize: 7, color: '#9ca3af', marginBottom: 2 },
    extraValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#374151' },

    tableHeader: { flexDirection: 'row', backgroundColor: primary, borderRadius: 3 },
    tableHeaderCell: {
      flex: 1, paddingVertical: 5, paddingHorizontal: 6,
      fontSize: 7, color: '#ffffff', fontFamily: 'Helvetica-Bold',
      letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'right',
    },
    tableHeaderCellFirst: { flex: 0.5 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    tableRowAlt: { backgroundColor: '#f9fafb' },
    tableCell: { flex: 1, paddingVertical: 4, paddingHorizontal: 6, fontSize: 9, color: '#374151', textAlign: 'right' },
    tableCellFirst: { flex: 0.5, color: '#6b7280', fontSize: 8 },
    tableFooter: { flexDirection: 'row', backgroundColor: primaryBg, borderTopWidth: 2, borderTopColor: primary },
    tableFooterCell: {
      flex: 1, paddingVertical: 5, paddingHorizontal: 6,
      fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a', textAlign: 'right',
    },
    tableFooterCellFirst: { flex: 0.5 },

    disclaimer: {
      backgroundColor: '#fefce8', borderWidth: 1, borderColor: '#fde68a',
      borderRadius: 5, padding: 9, marginBottom: 14,
    },
    disclaimerText: { fontSize: 7.5, color: '#78350f', lineHeight: 1.5 },

    footer: {
      flexDirection: 'row', justifyContent: 'space-between',
      borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 10,
    },
    footerText: { fontSize: 7.5, color: '#9ca3af', lineHeight: 1.7 },
    footerRight: { alignItems: 'flex-end' },
  })

  const metrics = [
    { label: 'CRÉDITO', value: brl(desiredAmount) },
    { label: 'PRAZO', value: `${desiredTermMonths} meses` },
    { label: 'TAXA REF.', value: rateStr },
    { label: 'CET ANUAL', value: cetAnual },
  ]

  const sistemaLabel = sistema === 'PRICE'
    ? 'Sistema PRICE · parcelas fixas'
    : 'Antecipação · desconto via saldo FGTS'

  const totalJuros = installments.reduce((acc, i) => acc + i.juros, 0)
  const totalAmort = installments.reduce((acc, i) => acc + i.amortizacao, 0)

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.accentBar} />
        <View style={s.content}>

          {/* Header */}
          <View style={s.header}>
            <View>
              {logoUrl ? (
                <Image src={logoUrl} style={s.logoImage} />
              ) : (
                <Text style={s.logoFallback}>{companyName}</Text>
              )}
            </View>
            <View style={s.headerRight}>
              <Text style={s.headerLabel}>Simulação de Crédito</Text>
              <Text style={s.headerDate}>{dateStr}</Text>
            </View>
          </View>

          {/* Badge + client */}
          <View style={s.badge}>
            <Text style={s.badgeText}>{productName.toUpperCase()}</Text>
          </View>
          <Text style={s.clientName}>{clientName}</Text>

          {/* Result box */}
          <View style={s.resultBox}>
            <View>
              <Text style={s.resultLabel}>
                {productSlug === 'fgts' ? 'VALOR DISPONÍVEL PARA SAQUE' : 'VALOR DO CRÉDITO'}
              </Text>
              <Text style={s.resultValue}>{brl(desiredAmount)}</Text>
              <Text style={s.resultSub}>{sistemaLabel}</Text>
            </View>
            {estimatedPayment != null && estimatedPayment > 0 && (
              <View>
                <Text style={s.resultSecLabel}>PARCELA MENSAL</Text>
                <Text style={s.resultSecValue}>{paymentStr}</Text>
              </View>
            )}
            {productSlug === 'fgts' && (
              <View>
                <Text style={s.resultSecLabel}>PARCELAS</Text>
                <Text style={s.resultSecValue}>Sem custo</Text>
              </View>
            )}
          </View>

          {/* Metrics */}
          <View style={s.metricsRow}>
            {metrics.map((m, idx) => (
              <View key={m.label} style={idx === metrics.length - 1 ? s.metricCellLast : s.metricCell}>
                <Text style={s.metricLabel}>{m.label}</Text>
                <Text style={s.metricValue}>{m.value}</Text>
              </View>
            ))}
          </View>

          {/* Product extras */}
          {extras.length > 0 && (
            <>
              <View style={s.dividerRow}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>DADOS DO PRODUTO</Text>
                <View style={s.dividerLine} />
              </View>
              <View style={s.extrasGrid}>
                {extras.map((e) => (
                  <View key={e.label} style={s.extraCell}>
                    <Text style={s.extraLabel}>{e.label}</Text>
                    <Text style={s.extraValue}>{e.value}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Installment table */}
          {installments.length > 0 && (
            <>
              <View style={s.dividerRow}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>
                  {`TABELA DE PARCELAS — SISTEMA ${sistema ?? 'PRICE'} (primeiras ${installments.length})`}
                </Text>
                <View style={s.dividerLine} />
              </View>
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderCell, s.tableHeaderCellFirst]}>#</Text>
                <Text style={s.tableHeaderCell}>Juros</Text>
                <Text style={s.tableHeaderCell}>Amortização</Text>
                <Text style={s.tableHeaderCell}>Saldo Devedor</Text>
              </View>
              {installments.map((row, idx) => (
                <View key={row.n} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
                  <Text style={[s.tableCell, s.tableCellFirst]}>{row.n}</Text>
                  <Text style={s.tableCell}>{brl(row.juros)}</Text>
                  <Text style={s.tableCell}>{brl(row.amortizacao)}</Text>
                  <Text style={s.tableCell}>{brl(row.saldoDevedor)}</Text>
                </View>
              ))}
              <View style={s.tableFooter}>
                <Text style={[s.tableFooterCell, s.tableFooterCellFirst]}>Total</Text>
                <Text style={s.tableFooterCell}>{brl(totalJuros)}</Text>
                <Text style={s.tableFooterCell}>{brl(totalAmort)}</Text>
                <Text style={s.tableFooterCell}>—</Text>
              </View>
            </>
          )}

          {/* Disclaimer */}
          <View style={[s.disclaimer, { marginTop: 14 }]}>
            <Text style={s.disclaimerText}>
              {`Esta é uma simulação referencial com base na taxa mínima de ${rateStr}. As condições finais dependem da análise de crédito e das políticas de concessão vigentes. Documento gerado automaticamente — não possui validade jurídica como contrato.`}
            </Text>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <View>
              <Text style={s.footerText}>{companyName}</Text>
              <Text style={s.footerText}>{`Simulação #${shortId}`}</Text>
            </View>
            <View style={s.footerRight}>
              <Text style={s.footerText}>{`Gerado em ${dateStr}`}</Text>
              <Text style={s.footerText}>Válido por 30 dias · Sujeito à análise de crédito</Text>
            </View>
          </View>

        </View>
      </Page>
    </Document>
  )
}
