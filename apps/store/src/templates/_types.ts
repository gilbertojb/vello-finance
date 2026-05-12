export type OklchColor = {
  l: number // lightness 0–1
  c: number // chroma   0–0.4
  h: number // hue      0–360
}

export type ColorTokens = {
  primary:    OklchColor
  background: OklchColor
  surface:    OklchColor
}

export type NavItem = { label: string; href: string }

export type HowItWorksStep = {
  title:       string
  description: string
  icon:        string // nome do ícone Lucide
}

export type TemplateContent = {
  hero: {
    eyebrow:   string
    headline:  string // suporta token {{displayName}}
    lede:      string
    imageUrl?: string
  }
  cta: {
    title:       string
    description: string
    testimonial?: { text: string; author: string }
  }
  productsSection: {
    title:       string
    description: string
  }
  howItWorks: {
    title: string
    steps: HowItWorksStep[]
  }
}

export type TemplateLayout = {
  hero: 'split' | 'centered'
}

export type TemplateNavigation = {
  header:         NavItem[]
  footer:         NavItem[]
  footerTagline?: string
  socials?: {
    whatsapp?:  string
    instagram?: string
    linkedin?:  string
  }
}

export type TemplateConfig = {
  id:          string
  displayName: string
  colors:      ColorTokens
  content:     TemplateContent
  navigation:  TemplateNavigation
  layout:      TemplateLayout
}
