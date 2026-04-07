'use client'

import { Building2 } from 'lucide-react'
import { useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field'
import { PercentInput } from '@/components/ui/masked-input'

interface PartnerItemProps {
  partner: { id: string; name: string }
  isSelected: boolean
  onToggle: (id: string) => void
  defaultIfCommission?: number
  defaultVelloCommission?: number
}

function toPercentStr(val?: number): string {
  if (val == null) return ''
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function PartnerItem({
  partner,
  isSelected,
  onToggle,
  defaultIfCommission,
  defaultVelloCommission,
}: PartnerItemProps) {
  const [velloCommission, setVelloCommission] = useState(() =>
    toPercentStr(defaultVelloCommission),
  )

  function handleIfCommissionChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = parseFloat(e.target.value.replace(',', '.'))
    if (!isNaN(raw) && raw > 0) {
      setVelloCommission(toPercentStr(raw / 2))
    }
  }

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
                <PercentInput
                  id={`if_commission_${partner.id}`}
                  name={`if_commission_${partner.id}`}
                  required={isSelected}
                  disabled={!isSelected}
                  defaultValue={toPercentStr(defaultIfCommission)}
                  onChange={handleIfCommissionChange}
                  className="bg-white"
                />
              </div>

              <div className="flex w-32 flex-col gap-1.5">
                <label
                  htmlFor={`vello_commission_${partner.id}`}
                  className="text-[10px] font-bold uppercase text-zinc-500"
                >
                  Retenção Vello (%)
                </label>
                <PercentInput
                  id={`vello_commission_${partner.id}`}
                  name={`vello_commission_${partner.id}`}
                  required={isSelected}
                  disabled={!isSelected}
                  value={velloCommission}
                  onChange={(e) => setVelloCommission(e.target.value)}
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
