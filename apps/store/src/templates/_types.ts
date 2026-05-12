export type OklchColor = {
  l: number
  c: number
  h: number
}

export type ColorTokens = {
  primary:    OklchColor
  background: OklchColor
  surface:    OklchColor
}

export type TemplateConfig = {
  id:     string
  colors: ColorTokens
}

export type TemplateHomeProduct = {
  tenantProductId: string
  coverUrl:        string | null
  productName:     string
  productTypeSlug: string | null
  minAmount:       number | null
  maxAmount:       number | null
  minTermMonths:   number | null
  maxTermMonths:   number | null
  minRate:         number | null
}

export type TemplateHomeProps = {
  displayName: string | null
  logoUrl:     string | null
  products:    TemplateHomeProduct[]
}
