import {
  Body,
  Container,
  Head,
  Html,
  Img,
  pixelBasedPreset,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import type { ReactNode } from 'react'

interface TenantLayoutProps {
  preview: string
  displayName: string
  logoUrl?: string | null
  primaryColor?: string | null
  children: ReactNode
}

const VELLO_LOGO = 'https://dash.vellofinance.com.br/static/vello-logo.png'
const DEFAULT_PRIMARY = '#4B64AA'

export function TenantLayout({
  preview,
  displayName,
  logoUrl,
  children,
}: TenantLayoutProps) {
  const logo = logoUrl || VELLO_LOGO

  return (
    <Html>
      <Head />
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Body className="bg-white font-sans mx-auto my-0">
          <Preview>{preview}</Preview>
          <Container className="mx-auto my-0 py-0 px-5">
            <Section className="mt-8">
              <Img src={logo} height="32" alt={displayName} style={{ width: 'auto', height: '32px' }} />
            </Section>
            {children}
            <Section>
              <Text className="text-xs leading-6 mt-10 text-neutral-400">
                ©{new Date().getFullYear()} {displayName} — Todos os direitos reservados.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export { DEFAULT_PRIMARY }
