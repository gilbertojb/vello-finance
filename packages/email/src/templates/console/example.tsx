import { Button, Heading, Section, Text } from '@react-email/components'

import { DEFAULT_PRIMARY, TenantLayout } from '../../layouts/tenant-layout'

interface ConsoleExampleEmailProps {
  contactName: string
  displayName: string
  logoUrl?: string | null
  primaryColor?: string | null
}

export function ConsoleExampleEmail({
  contactName,
  displayName,
  logoUrl,
  primaryColor,
}: ConsoleExampleEmailProps) {
  const color = primaryColor || DEFAULT_PRIMARY

  return (
    <TenantLayout
      preview="Exemplo de Email do Console"
      displayName={displayName}
      logoUrl={logoUrl}
      primaryColor={color}
    >
      <Heading className="text-neutral-900 text-3xl font-bold my-8 mx-0 p-0 leading-10">
        Olá, {contactName}
      </Heading>

      <Text className="text-lg mb-7.5">
        Este é um exemplo de email enviado do console, utilizando o layout do
        tenant.
      </Text>

      <Section className="mb-7.5 py-4">
        <Button
          href="https://vellofinance.com.br"
          style={{ backgroundColor: color }}
          className="text-white rounded px-6 py-3 text-base font-semibold text-center mt-2 w-full block"
        >
          Acessar Plataforma
        </Button>
      </Section>
    </TenantLayout>
  )
}

export default ConsoleExampleEmail
