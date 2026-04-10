import { TenantWelcomeEmail } from '../src/templates/console/tenant-welcome'

// biome-ignore lint/correctness/noUnusedImports: React is required for JSX
import * as React from 'react'

export default function TenantWelcomePreview() {
  return (
    <TenantWelcomeEmail
      contactName="João Silva"
      displayName="Crédito Fácil"
      resetLink="https://credito-facil.vellofinance.com.br/reset-password?token=example-token&type=recovery"
      logoUrl={null}
      primaryColor={null}
    />
  )
}
