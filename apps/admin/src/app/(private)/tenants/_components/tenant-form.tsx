'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useFormState } from '@/hooks/use-form-state'
import {
  fetchCnpjData,
  formatPhone,
  maskCnpj,
  normalizeBranding,
  slugify,
  validateCnpj,
} from '@/lib/helpers'

import { createTenant, updateTenant } from '../actions'
import { TenantBankCard } from './tenant-bank-card'
import { TenantBrandingCard } from './tenant-branding-card'
import { TenantCompanyCard } from './tenant-company-card'
import type { TenantForEdit } from './tenant-form-types'
import { TenantStoreCard } from './tenant-store-card'

export type { TenantForEdit } from './tenant-form-types'

type Props = {
  tenant?: TenantForEdit
}

export function TenantForm({ tenant }: Props) {
  const router = useRouter()
  const isEdit = !!tenant
  const branding = normalizeBranding(tenant?.tenant_branding ?? null)

  // Slug: em edição, considera já editado manualmente para não ser sobrescrito
  const slugManuallyEdited = useRef(isEdit)
  const [slug, setSlug] = useState(tenant?.slug ?? '')

  // CNPJ: só dispara auto-fill se o usuário editou o campo (cnpjDirty)
  const cnpjDirty = useRef(false)
  const [cnpj, setCnpj] = useState(maskCnpj(tenant?.cnpj ?? ''))
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false)
  const [cnpjLookupError, setCnpjLookupError] = useState<string | null>(null)

  // Campos auto-preenchíveis
  const [name, setName] = useState(tenant?.name ?? '')
  const [companyName, setCompanyName] = useState(tenant?.company_name ?? '')
  const [email, setEmail] = useState(tenant?.email ?? '')
  const [phone, setPhone] = useState(formatPhone(tenant?.phone ?? ''))

  // Identidade visual
  const [isWhiteLabel, setIsWhiteLabel] = useState(
    branding?.use_custom_theme ?? false,
  )

  const action = isEdit ? updateTenant : createTenant

  const [formState, handleSubmit, isPending] = useFormState(
    action,
    () => {
      toast.success(
        isEdit
          ? 'Parceiro atualizado com sucesso!'
          : 'Parceiro cadastrado com sucesso!',
      )
      router.push('/tenants')
    },
    (msg: string) => {
      toast.error(msg)
    },
  )

  function handleCnpjChange(e: React.ChangeEvent<HTMLInputElement>) {
    cnpjDirty.current = true
    setCnpj(maskCnpj(e.target.value))
    setCnpjLookupError(null)
  }

  async function handleCnpjBlur() {
    if (!cnpjDirty.current || !validateCnpj(cnpj)) return

    setIsFetchingCnpj(true)
    setCnpjLookupError(null)

    try {
      const data = await fetchCnpjData(cnpj)

      if (data.name && !slugManuallyEdited.current) setSlug(slugify(data.name))

      setName(data.name)
      setCompanyName(data.companyName)
      setEmail(data.email)
      setPhone(data.phone)
    } catch {
      setCnpjLookupError('CNPJ não encontrado na Receita Federal.')
    } finally {
      setIsFetchingCnpj(false)
    }
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value)
    if (!slugManuallyEdited.current) setSlug(slugify(e.target.value))
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    slugManuallyEdited.current = true
    setSlug(e.target.value)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full">
      {isEdit && <input type="hidden" name="id" value={tenant.id} />}

      <TenantCompanyCard
        cnpj={cnpj}
        onCnpjChange={handleCnpjChange}
        onCnpjBlur={handleCnpjBlur}
        isFetchingCnpj={isFetchingCnpj}
        cnpjLookupError={cnpjLookupError}
        name={name}
        onNameChange={handleNameChange}
        companyName={companyName}
        onCompanyNameChange={(e) => setCompanyName(e.target.value)}
        email={email}
        onEmailChange={(e) => setEmail(e.target.value)}
        phone={phone}
        onPhoneChange={(e) => setPhone(e.target.value)}
        errors={formState.errors}
      />

      <TenantStoreCard
        slug={slug}
        onSlugChange={handleSlugChange}
        defaultCustomDomain={tenant?.custom_domain ?? ''}
        errors={formState.errors}
      />

      <TenantBrandingCard
        branding={branding}
        isWhiteLabel={isWhiteLabel}
        onWhiteLabelChange={setIsWhiteLabel}
      />

      <TenantBankCard
        defaultBankName={tenant?.bank_name ?? ''}
        defaultBankPixKey={tenant?.bank_pix_key ?? ''}
        defaultBankAgency={tenant?.bank_agency ?? ''}
        defaultBankAccount={tenant?.bank_account ?? ''}
      />

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.push('/tenants')}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isEdit ? (
            'Salvar Alterações'
          ) : (
            'Cadastrar Parceiro'
          )}
        </Button>
      </div>
    </form>
  )
}
