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

// biome-ignore lint/correctness/noUnusedImports: React is required for JSX
import * as React from 'react'

interface AdminLayoutProps {
  preview: string
  baseUrl?: string
  children: React.ReactNode
}

export function AdminLayout({ preview, baseUrl = '', children }: AdminLayoutProps) {
  return (
    <Html>
      <Head />
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Body className="bg-white font-sans mx-auto my-0">
          <Preview>{preview}</Preview>
          <Container className="mx-auto my-0 py-0 px-5">
            <Section className="mt-8">
              <Img
                src={`${baseUrl}/static/vello-logo.png`}
                width="120"
                height="32"
                alt="Vello"
              />
            </Section>
            {children}
            <Section>
              <Text className="text-xs leading-6 mt-10 text-neutral-400">
                ©{new Date().getFullYear()} Vello - Todos os direitos reservados.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
