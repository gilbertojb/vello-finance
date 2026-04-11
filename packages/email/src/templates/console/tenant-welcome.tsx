import {
  Button,
  Heading,
  Link,
  Section,
  Text,
} from '@react-email/components'


import { DEFAULT_PRIMARY, TenantLayout } from '../../layouts/tenant-layout'

interface TenantWelcomeEmailProps {
  contactName: string
  displayName: string
  resetLink: string
  logoUrl?: string | null
  primaryColor?: string | null
}

export function TenantWelcomeEmail({
  contactName,
  displayName,
  resetLink,
  logoUrl,
  primaryColor,
}: TenantWelcomeEmailProps) {
  const color = primaryColor || DEFAULT_PRIMARY

  return (
    <TenantLayout
      preview="Bem-vindo à Vello Finance — defina sua senha"
      displayName={displayName}
      logoUrl={logoUrl}
      primaryColor={color}
    >
      <Heading className="text-neutral-900 text-3xl font-bold my-8 mx-0 p-0 leading-10">
        Olá, {contactName}
      </Heading>

      <Text className="text-lg mb-7.5">
        Sua conta na Vello Finance foi criada com sucesso. Para começar a usar o
        painel, defina sua senha clicando no botão abaixo.
      </Text>

      <Section className="mb-7.5 py-4">
        <Button
          href={resetLink}
          style={{ backgroundColor: color }}
          className="text-white rounded px-6 py-3 text-base font-semibold text-center mt-2 w-full block"
        >
          Definir minha senha
        </Button>
      </Section>

      <Text className="text-neutral-600 text-sm leading-6 mb-4">
        Ou copie e cole a URL abaixo no seu navegador:
        <br />
        <Link href={resetLink} className="text-blue-600 underline break-all">
          {resetLink}
        </Link>
      </Text>

      <Text className="text-neutral-500 text-sm leading-6">
        Se você não esperava este email, pode ignorá-lo com segurança.
      </Text>
    </TenantLayout>
  )
}

export default TenantWelcomeEmail
