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

// biome-ignore lint/correctness/noUnusedImports: React is required for JSX
import * as React from 'react'

interface PasswordRecoverEmailProps {
  recoverLink?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

export const PasswordRecoverEmail = ({
  recoverLink,
}: PasswordRecoverEmailProps) => (
  <Html>
    <Head />
    <Tailwind
      config={{
        presets: [pixelBasedPreset],
      }}
    >
      <Body className="bg-white font-sans mx-auto my-0">
        <Preview>Recuperação de Senha</Preview>
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
            Recuperação de Senha
          </Heading>
          <Text className="text-lg mb-7.5">
            Você solicitou a recuperação da sua senha. Clique no botão abaixo
            para cadastrar uma nova senha:
          </Text>

          <Section className="mb-7.5 py-4">
            <Button
              href={recoverLink}
              className="bg-[#4B64AA] text-white rounded px-6 py-3 text-base font-semibold text-center mt-2 w-full block"
            >
              CADASTRAR NOVA SENHA
            </Button>
          </Section>

          <Text className="text-neutral-600 text-sm leading-6 mb-4">
            Ou copie e cole a URL abaixo em seu navegador:
            <br />
            <Link
              href={recoverLink}
              className="text-blue-600 underline break-all"
            >
              {recoverLink}
            </Link>
          </Text>

          <Text className="text-neutral-500 text-sm leading-6">
            Se você não solicitou esta recuperação, pode ignorar este email com
            segurança. Sua senha não será alterada.
          </Text>

          <Section>
            <Text className="text-xs leading-6 mt-10 text-neutral-400">
              ©2026 Vello - Todos os direitos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)

PasswordRecoverEmail.PreviewProps = {
  recoverLink: 'http://localhost:3000/reset-password?token=example-uuid-1234',
} as PasswordRecoverEmailProps

export default PasswordRecoverEmail
