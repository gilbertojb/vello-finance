// biome-ignore lint/correctness/noUnusedImports: React is required for JSX
import * as React from 'react'

import { TenantWelcomeEmail } from '../src/templates/admin/tenant-welcome'

export default function TenantWelcomePreview() {
  return (
    <TenantWelcomeEmail
      contactName="João Silva"
      resetLink="https://credito-facil.vellofinance.com.br/reset-password?token=example-token&type=recovery"
    />
  )
}
