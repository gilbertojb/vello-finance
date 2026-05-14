import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type JSXElementConstructor, type ReactElement } from 'react'
import { getSimulationForPdf, getTenantBranding } from '@/app/(store)/queries'
import { getTemplate } from '@/templates'
import { SimulationPdf } from '@/lib/pdf/simulation-pdf'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const tenantId = (await headers()).get('x-tenant-id') ?? ''

  const [simulation, branding] = await Promise.all([
    getSimulationForPdf(id, tenantId),
    getTenantBranding(tenantId),
  ])

  if (!simulation || !simulation.products) {
    return new Response('Not Found', { status: 404 })
  }

  const template = getTemplate(branding?.template_id)
  const { primary } = template.colors

  const productType = Array.isArray(simulation.products.product_type)
    ? simulation.products.product_type[0]
    : simulation.products.product_type
  const slug = (productType as { slug: string } | null)?.slug ?? ''

  const createdAt = simulation.created_at ?? new Date().toISOString()
  const companyName = branding?.company_display_name ?? 'Vello Finance'
  const logoUrl = branding?.logo_url ?? null

  const element = createElement(SimulationPdf, {
    simulationId: simulation.id,
    clientName: simulation.client_name,
    productName: simulation.products.name,
    productSlug: slug,
    desiredAmount: Number(simulation.desired_amount),
    desiredTermMonths: simulation.desired_term_months,
    estimatedRate: simulation.estimated_rate != null ? Number(simulation.estimated_rate) : null,
    estimatedPayment: simulation.estimated_payment != null ? Number(simulation.estimated_payment) : null,
    simulationData: (simulation.simulation_data as Record<string, unknown>) ?? {},
    createdAt,
    companyName,
    logoUrl,
    primaryL: primary.l,
    primaryC: primary.c,
    primaryH: primary.h,
  }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>

  const pdfBuffer = await renderToBuffer(element)

  const date = new Date().toISOString().slice(0, 10)
  const filename = `simulacao-${slug}-${date}.pdf`

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
