import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { getProductExtras } from './product-extras'
import { oklchToHex } from './oklch-to-rgb'

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
}: SimulationPdfProps) {
  const primary = oklchToHex(primaryL, primaryC, primaryH)
  const extras: Extra[] = getProductExtras(productSlug, simulationData)
  const total = estimatedPayment != null ? estimatedPayment * desiredTermMonths : null
  const shortId = simulationId.slice(0, 8)
  const dateStr = formatDate(createdAt)
  const rateStr = estimatedRate != null
    ? `${estimatedRate.toFixed(2).replace('.', ',')}% a.m.`
    : '—'
  const paymentStr = estimatedPayment != null ? brl(estimatedPayment) : '—'
  const totalStr = total != null ? brl(total) : '—'

  const s = StyleSheet.create({
    page: { backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
    accentBar: { height: 4, backgroundColor: primary },
    content: { paddingHorizontal: 36, paddingTop: 16, paddingBottom: 36 },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 16,
    },
    logoImage: { height: 28, objectFit: 'contain' },
    logoFallback: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: primary },
    headerRight: { alignItems: 'flex-end' },
    headerLabel: { fontSize: 8, color: '#9ca3af', letterSpacing: 0.8 },
    headerDate: { fontSize: 9, color: '#6b7280', marginTop: 2 },
    badge: {
      backgroundColor: primary, borderRadius: 4,
      paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6,
    },
    badgeText: { fontSize: 8, color: '#ffffff', fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
    clientName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 14 },
    card: {
      backgroundColor: primary, borderRadius: 10, padding: 16,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12,
    },
    cardLabel: { fontSize: 8, color: 'rgba(255,255,255,0.65)', letterSpacing: 1, marginBottom: 4 },
    cardAmount: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
    cardSub: { fontSize: 8, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
    cardTotalLabel: { fontSize: 9, color: 'rgba(255,255,255,0.55)', marginBottom: 2, textAlign: 'right' },
    cardTotal: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: 'rgba(255,255,255,0.85)', textAlign: 'right' },
    metricsRow: { flexDirection: 'row', marginBottom: 14 },
    metricCell: {
      flex: 1, backgroundColor: '#f8fafc', borderRadius: 6, padding: 10,
      borderWidth: 1, borderColor: '#f1f5f9', marginRight: 6,
    },
    metricCellLast: {
      flex: 1, backgroundColor: '#f8fafc', borderRadius: 6, padding: 10,
      borderWidth: 1, borderColor: '#f1f5f9',
    },
    metricLabel: { fontSize: 8, color: '#94a3b8', letterSpacing: 0.8, marginBottom: 3 },
    metricValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#f1f5f9' },
    dividerText: {
      fontSize: 8, color: '#94a3b8', fontFamily: 'Helvetica-Bold',
      letterSpacing: 1, marginHorizontal: 8,
    },
    extrasGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
    extraCell: {
      width: '48%', borderWidth: 1, borderColor: '#f1f5f9',
      borderRadius: 6, padding: 9, marginRight: '2%', marginBottom: 6,
    },
    extraLabel: { fontSize: 8, color: '#94a3b8', marginBottom: 2 },
    extraValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#334155' },
    disclaimer: {
      backgroundColor: '#fef9ec', borderWidth: 1, borderColor: '#fde68a',
      borderRadius: 6, padding: 10, marginBottom: 14,
    },
    disclaimerText: { fontSize: 8, color: '#92400e', lineHeight: 1.5 },
    footer: {
      flexDirection: 'row', justifyContent: 'space-between',
      borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12,
    },
    footerText: { fontSize: 8, color: '#cbd5e1', marginBottom: 2 },
    footerRight: { alignItems: 'flex-end' },
  })

  const metrics = [
    { label: 'CRÉDITO', value: brl(desiredAmount), last: false },
    { label: 'PRAZO', value: `${desiredTermMonths} meses`, last: false },
    { label: 'TAXA REF.', value: rateStr, last: true },
  ]

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
              <Text style={s.headerLabel}>SIMULAÇÃO DE CRÉDITO</Text>
              <Text style={s.headerDate}>{dateStr}</Text>
            </View>
          </View>

          {/* Client + product */}
          <View style={s.badge}>
            <Text style={s.badgeText}>{productName.toUpperCase()}</Text>
          </View>
          <Text style={s.clientName}>{clientName}</Text>

          {/* Installment card */}
          <View style={s.card}>
            <View>
              <Text style={s.cardLabel}>PARCELA MENSAL</Text>
              <Text style={s.cardAmount}>{paymentStr}</Text>
              <Text style={s.cardSub}>Sistema PRICE · Parcelas fixas</Text>
            </View>
            <View>
              <Text style={s.cardTotalLabel}>Total estimado</Text>
              <Text style={s.cardTotal}>{totalStr}</Text>
            </View>
          </View>

          {/* Metrics */}
          <View style={s.metricsRow}>
            {metrics.map((m) => (
              <View key={m.label} style={m.last ? s.metricCellLast : s.metricCell}>
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

          {/* Disclaimer */}
          <View style={s.disclaimer}>
            <Text style={s.disclaimerText}>
              {`Esta é uma simulação referencial com base na taxa mínima de ${rateStr}. As condições finais dependem da análise de crédito e das políticas de concessão vigentes.`}
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
              <Text style={s.footerText}>Válido por 30 dias · Sujeito à análise</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
