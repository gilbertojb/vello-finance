import { Button, Heading, Link, Section, Text } from '@react-email/components'

import { DEFAULT_PRIMARY, TenantLayout } from '../../layouts/tenant-layout'

interface TenantPasswordRecoveryEmailProps {
  resetLink: string
  displayName?: string
  logoUrl?: string | null
  primaryColor?: string | null
}

export function TenantPasswordRecoveryEmail({
  resetLink,
  displayName = 'Vello Finance',
  logoUrl,
  primaryColor,
}: TenantPasswordRecoveryEmailProps) {
  const color = primaryColor || DEFAULT_PRIMARY

  return (
    <TenantLayout
      preview="Recuperação de senha"
      displayName={displayName}
      logoUrl={logoUrl}
      primaryColor={color}
    >
      <Heading className="text-neutral-900 text-3xl font-bold my-8 mx-0 p-0 leading-10">
        Recuperação de senha
      </Heading>

      <Text className="text-lg mb-7.5">
        Você solicitou a recuperação da sua senha. Clique no botão abaixo para
        cadastrar uma nova senha:
      </Text>

      <Section className="mb-7.5 py-4">
        <Button
          href={resetLink}
          style={{ backgroundColor: color }}
          className="text-white rounded px-6 py-3 text-base font-semibold text-center mt-2 w-full block"
        >
          Cadastrar nova senha
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
        Se você não solicitou esta recuperação, pode ignorar este e-mail com
        segurança. Sua senha não será alterada.
      </Text>
    </TenantLayout>
  )
}

TenantPasswordRecoveryEmail.PreviewProps = {
  resetLink: 'https://exemplo.vellofinance.com.br/reset-password?token=abc&type=recovery',
  displayName: 'Vello Finance',
} as TenantPasswordRecoveryEmailProps

export default TenantPasswordRecoveryEmail
