import { Plus_Jakarta_Sans, Instrument_Serif } from 'next/font/google'
import type { Metadata } from 'next'
import { TenantLogo } from '@/components/tenant-logo'
import type { TemplateHomeProps } from '@/templates/_types'
import { cn } from '@/lib/utils'

import { Zp2Header } from './_components/header'
import { Zp2Footer } from './_components/footer'
import { HeroSection } from './_components/hero-section'
import { BenefitsSection } from './_components/benefits-section'
import { PartnersSection } from './_components/partners-section'
import { ProductsSection } from './_components/products-section'
import { HowItWorks } from './_components/how-it-works'
import { ValuePropSection } from './_components/value-prop-section'
import { FaqSection } from './_components/faq-section'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

const instrument = Instrument_Serif({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = { title: 'Crédito feito para você' }

export function Zp2Home({ displayName, logoUrl, products: _ }: TemplateHomeProps) {
  const name = displayName ?? 'ZP Pay'
  const logoSlot = logoUrl
    ? <TenantLogo url={logoUrl} alt={name} width={140} height={40} className="h-10 w-auto" />
    : null

  return (
    <div className={cn(jakarta.variable, instrument.variable, 'flex min-h-svh flex-col')}>
      <Zp2Header logoSlot={logoSlot} displayName={displayName} />
      <main className="flex-1">
        <HeroSection displayName={displayName} />
        <BenefitsSection />
        <PartnersSection />
        <ProductsSection />
        <HowItWorks />
        <ValuePropSection />
        <FaqSection />
      </main>
      <Zp2Footer displayName={displayName} logoUrl={logoUrl} />
    </div>
  )
}
