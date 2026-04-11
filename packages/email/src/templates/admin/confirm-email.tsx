import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  pixelBasedPreset,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

interface ConfirmEmailProps {
  verificationCode?: string
  baseUrl?: string
}

export const ConfirmEmail = ({
  verificationCode,
  baseUrl = '',
}: ConfirmEmailProps) => (
  <Html>
    <Head />
    <Tailwind
      config={{
        presets: [pixelBasedPreset],
      }}
    >
      <Body className="bg-white font-sans mx-auto my-0">
        <Preview>Confirme seu email</Preview>
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
            Confirme seu email
          </Heading>
          <Text className="text-lg mb-7.5">
            Seu código de confirmação está abaixo - insira-o na janela do
            navegador aberta e nós o ajudaremos a fazer login.
          </Text>

          <Section className="bg-neutral-100 rounded mb-7.5 py-10 px-2.5">
            <Text className="text-3xl leading-6 text-center align-middle">
              {verificationCode}
            </Text>
          </Section>

          <Text className="text-neutral-500 text-sm leading-6">
            Se você não solicitou este email, não se preocupe, pode ignorá-lo
            com segurança.
          </Text>

          <Section>
            <Text className="text-xs leading-6 mb-10 text-neutral-400">
              ©2026 Vello - Todos os direitos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)

ConfirmEmail.PreviewProps = {
  verificationCode: 'DJZ-TLX',
} as ConfirmEmailProps

export default ConfirmEmail
