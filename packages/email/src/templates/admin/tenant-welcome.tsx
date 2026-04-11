import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  pixelBasedPreset,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

interface TenantWelcomeEmailProps {
  contactName: string
  resetLink: string
  baseUrl?: string
}

export const TenantWelcomeEmail = ({
  contactName,
  resetLink,
  baseUrl = '',
}: TenantWelcomeEmailProps) => (
  <Html>
    <Head />
    <Tailwind
      config={{
        presets: [pixelBasedPreset],
      }}
    >
      <Body className="bg-white font-sans mx-auto my-0">
        <Preview>Bem-vindo à Vello Finance — defina sua senha</Preview>
        <Container className="mx-auto my-0 py-0 px-5">
          <Section className="mt-8">
            <Img
              src={`${baseUrl}/static/vello-logo.png`}
              width="120"
              height="32"
              alt="Vello"
            />
          </Section>
          <Heading className="text-neutral-900 text-3xl font-bold my-8 mx-0 p-0 leading-10">
            Olá, {contactName}
          </Heading>

          <Text className="text-lg mb-7.5">
            Sua conta na Vello Finance foi criada com sucesso. Para começar a
            usar o painel, defina sua senha clicando no botão abaixo.
          </Text>

          <Section className="mb-7.5 py-4">
            <Button
              href={resetLink}
              className="bg-[#4B64AA] text-white rounded px-6 py-3 text-base font-semibold text-center mt-2 w-full block"
            >
              Definir minha senha
            </Button>
          </Section>

          <Text className="text-neutral-600 text-sm leading-6 mb-4">
            Ou copie e cole a URL abaixo no seu navegador:
            <br />
            <Link
              href={resetLink}
              className="text-blue-600 underline break-all"
            >
              {resetLink}
            </Link>
          </Text>

          <Text className="text-neutral-500 text-sm leading-6">
            Se você não esperava este email, pode ignorá-lo com segurança.
          </Text>

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

TenantWelcomeEmail.PreviewProps = {
  resetLink: 'https://dash.vellofinance.com.br/reset-password',
  contactName: 'Gilberto Bueno',
  baseUrl: 'http://localhost:3000',
} as TenantWelcomeEmailProps

export default TenantWelcomeEmail
