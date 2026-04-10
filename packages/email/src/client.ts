import { Resend } from 'resend'

interface SendEmailOptions {
  to: string
  subject: string
  react: React.ReactElement
  from?: string
  apiKey: string
}

export async function sendEmail(options: SendEmailOptions) {
  const resend = new Resend(options.apiKey)
  return resend.emails.send({
    from: options.from ?? 'Vello Finance <noreply@vellofinance.com.br>',
    to: options.to,
    subject: options.subject,
    react: options.react,
  })
}
