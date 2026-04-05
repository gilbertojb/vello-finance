import { Building2 } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

interface PartnerItemProps {
  partner: { id: string; name: string }
  isSelected: boolean
  onToggle: (id: string) => void
  defaultIfCommission?: number
  defaultVelloCommission?: number
}

export function PartnerItem({
  partner,
  isSelected,
  onToggle,
  defaultIfCommission,
  defaultVelloCommission,
}: PartnerItemProps) {
  return (
    <FieldGroup className="w-full">
      <FieldLabel
        className={`w-full rounded-xl border-2 transition-colors ${
          isSelected
            ? 'border-vello-blue/20 bg-vello-subtle'
            : 'border-transparent bg-zinc-50'
        }`}
      >
        <Field orientation="horizontal">
          <FieldContent className="flex flex-col md:flex-row gap-4 md:items-center">
            <Checkbox
              id={`partner_${partner.id}`}
              name="partner_ids"
              value={partner.id}
              checked={isSelected}
              onCheckedChange={() => onToggle(partner.id)}
              className="h-5 w-5 rounded border-zinc-300 data-[state=checked]:bg-vello-blue data-[state=checked]:border-vello-blue"
            />

            <FieldTitle className="text-base font-bold text-zinc-700">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-zinc-100">
                <Building2
                  className={`h-5 w-5 ${
                    isSelected ? 'text-vello-blue' : 'text-zinc-400'
                  }`}
                />
              </div>

              {partner.name}
            </FieldTitle>

            <div className="flex items-center gap-4 sm:ml-auto">
              <div className="flex w-32 flex-col gap-1.5">
                <label
                  htmlFor={`if_commission_${partner.id}`}
                  className="text-[10px] font-bold uppercase text-zinc-500"
                >
                  Comissão (%)
                </label>
                <Input
                  id={`if_commission_${partner.id}`}
                  name={`if_commission_${partner.id}`}
                  type="number"
                  step="0.001"
                  min="0.001"
                  max="100"
                  required={isSelected}
                  disabled={!isSelected}
                  placeholder="0.00"
                  defaultValue={defaultIfCommission ?? ''}
                  className="bg-white"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    const velloInput = document.getElementById(
                      `vello_commission_${partner.id}`,
                    ) as HTMLInputElement
                    if (velloInput) {
                      if (!Number.isNaN(val)) {
                        velloInput.value = String(val / 2)
                      } else {
                        velloInput.value = ''
                      }
                    }
                  }}
                />
              </div>

              <div className="flex w-32 flex-col gap-1.5">
                <label
                  htmlFor={`vello_commission_${partner.id}`}
                  className="text-[10px] font-bold uppercase text-zinc-500"
                >
                  Retenção Vello (%)
                </label>
                <Input
                  id={`vello_commission_${partner.id}`}
                  name={`vello_commission_${partner.id}`}
                  type="number"
                  step="0.001"
                  min="0"
                  max="100"
                  required={isSelected}
                  disabled={!isSelected}
                  placeholder="0.00"
                  defaultValue={defaultVelloCommission ?? ''}
                  className="bg-white"
                />
              </div>
            </div>
          </FieldContent>
        </Field>
      </FieldLabel>
    </FieldGroup>
  )
}
