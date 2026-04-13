import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import type { Partner, ProductWithPartners } from './product-form-types'
import { PartnerItem } from './partner-item'

type Props = {
  partners: Partner[]
  product?: ProductWithPartners
  selectedPartners: Set<string>
  onTogglePartner: (id: string) => void
}

export function ProductPartnersCard({
  partners,
  product,
  selectedPartners,
  onTogglePartner,
}: Props) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Instituições Financeiras</CardTitle>
        <CardDescription>
          Selecione as IFs que operam este produto e informe os percentuais de
          comissão negociados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {partners.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Nenhuma instituição financeira cadastrada.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {partners.map((partner) => {
              const isSelected = selectedPartners.has(partner.id)
              const linked = product?.product_financial_partners.find(
                (p) => p.financial_partner_id === partner.id,
              )
              return (
                <PartnerItem
                  key={partner.id}
                  partner={partner}
                  isSelected={isSelected}
                  onToggle={onTogglePartner}
                  defaultIfCommission={linked?.if_commission_pct}
                  defaultVelloCommission={linked?.vello_commission_pct}
                />
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
