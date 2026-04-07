# Spec: Tema dinâmico white-label por tenant no console

## Objetivo
Permitir que o projeto console carregue um tema base global via `globals.css`, e aplique customizações específicas por tenant white-label via CSS variables e um campo de CSS customizado armazenado no banco. A solução deve manter a semântica de Tailwind e shadcn/ui, suportar um seletor de escopo para cada tenant e incluir o conceito de `Base Color` e `Theme Color`, semelhante ao criador de tema do shadcn/ui.

## Contexto
Hoje o console usa um tema padrão do sistema. Para tenants white-label, isso é insuficiente, porque alguns clientes precisam de personalização visual mais forte, como variações de layout, tons, superfícies, contraste, radius, tipografia e detalhes de UI. O exemplo anexo mostra um produto com identidade bem mais marcada do que apenas `primary` e `secondary`.

## Decisão de arquitetura
Adotar três camadas:

1. `globals.css` como base global do sistema.
2. `tenant-theme.css` gerado dinamicamente e aplicado por tenant.
3. `custom_css` opcional, armazenado no tenant, para ajustes avançados e exclusivos.

A estratégia é manter os componentes shadcn/tailwind consumindo tokens semânticos, usando CSS variables em `:root` ou em um seletor isolado do tenant. Isso preserva a portabilidade do design e permite que o console continue funcionando com o tema padrão, enquanto o white-label aplica variações específicas.

## Conceitos de tema

### Base Color
Representa a família cromática principal do tema, igual ao conceito do shadcn/ui: `Neutral`, `Stone`, `Zinc`, `Mauve`, `Olive`, `Mist` e `Taupe`.

### Theme Color
Representa a tonalidade aplicada sobre a base escolhida. Em vez de depender só de `primary` e `secondary`, o sistema passa a trabalhar com um conjunto mais amplo de tokens semânticos como as cores padrão do tailwind: `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`.

### Custom CSS do tenant
Campo textarea no cadastro do tenant para armazenar CSS manual. Esse CSS pode sobrescrever ou complementar as CSS variables geradas pelo sistema.

## Modelo de dados proposto

### `tenant_branding`
Adicionar os campos:
- `base_color`
- `theme_color`
- `custom_css`
- `use_custom_theme` boolean

### `tenant_theme_tokens`
Salvar os tokens calculados ou editados pelo console:
- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`
- `chart-1` ... `chart-5`
- `sidebar` tokens
- opcionalmente `font-sans`, `font-heading`

## Aplicação no console

### Fluxo de carregamento
1. O usuário entra no console.
2. O app identifica o tenant.
3. O frontend chama o endpoint `/api/tenant-theme`.
4. A API devolve `baseColor`, `themeColor`, `variables` e `customCss`.
5. O cliente aplica as variables no `:root` ou em um seletor isolado.
6. O `customCss` é injetado por último em um `<style>` separado.

### Regra de precedência
- `globals.css` é a base.
- `tenant-theme.css` sobrescreve o padrão.
- `customCss` do tenant vence o tema gerado, desde que seja carregado depois.

## Renderização esperada

### Console padrão
Usa `globals.css` apenas.

### Console white-label
Usa `globals.css` + `tenant-theme.css` + `customCss`.

### Escopo recomendado
Para evitar vazamento visual entre tenants, o tema pode ser aplicado em um container raiz, por exemplo:

```html
<html data-tenant-theme="demo-tenant">
```

Ou diretamente em `:root` quando o app for dedicado a um único tenant.

## Tokens e mapeamento

### Mapeamento mínimo
- `background` → fundo geral
- `foreground` → texto principal
- `card` → superfícies elevadas
- `popover` → menus e overlays
- `primary` → CTA principal
- `secondary` → CTA secundário
- `accent` → destaques e hover
- `muted` → estados suaves
- `border` e `input` → bordas e campos
- `ring` → foco
- `radius` → bordas arredondadas

### Tokens adicionais para white-label avançado
- `success`
- `warning`
- `info`
- `sidebar`
- `sidebar-primary`
- `sidebar-accent`
- `shadow-tenant`
- `tenant-gradient`

## Exemplo de CSS renderizado

### `tenant-theme.css`
```css
[data-tenant-theme="demo-tenant"] {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 42 87% 61%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 24 32% 20%;
  --secondary-foreground: 0 0% 100%;
  --accent: 18 72% 52%;
  --accent-foreground: 0 0% 100%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 42 87% 61%;
  --radius: 1rem;
}
```

### `custom_css` do tenant
```css
[data-tenant-theme="demo-tenant"] .hero-panel {
  background: linear-gradient(135deg, rgba(75, 40, 30, 0.92), rgba(25, 12, 10, 0.92));
  border-radius: 28px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}

[data-tenant-theme="demo-tenant"] .login-card {
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
```

## Exemplo de uso no console

### Layout
```tsx
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getCurrentTenant()

  return (
    <html lang="pt-BR" data-tenant-theme={tenant?.slug}>
      <body>
        <TenantThemeLoader tenantSlug={tenant?.slug ?? 'default'} />
        {children}
      </body>
    </html>
  )
}
```

### Loader
```tsx
'use client'

import { useEffect } from 'react'
import { loadTenantTheme } from '@/lib/theme/load-tenant-theme'

export function TenantThemeLoader({ tenantSlug }: { tenantSlug: string }) {
  useEffect(() => {
    if (!tenantSlug) return
    loadTenantTheme(tenantSlug)
  }, [tenantSlug])

  return null
}
```

### Carregamento do tema
```ts
const response = await fetch(`/api/tenant-theme?slug=${tenantSlug}`)
const payload = await response.json()
applyTenantTheme(payload)
```

## API esperada
A API deve retornar algo neste formato:

```json
{
  "selector": "[data-tenant-theme='demo-tenant']",
  "baseColor": "Neutral",
  "themeColor": "Warm Brown",
  "variables": {
    "background": "0 0% 100%",
    "foreground": "222.2 84% 4.9%",
    "primary": "42 87% 61%",
    "primary-foreground": "222.2 47.4% 11.2%",
    "radius": "1rem"
  },
  "customCss": "[data-tenant-theme='demo-tenant'] .hero-panel { ... }"
}
```

## Tailwind e shadcn
O `tailwind.config.js` deve continuar mapeando tokens para `hsl(var(--token))`, de forma que todos os componentes shadcn continuem usando a semântica padrão.

Exemplo:

```js
colors: {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))',
  },
  secondary: {
    DEFAULT: 'hsl(var(--secondary))',
    foreground: 'hsl(var(--secondary-foreground))',
  },
}
```

## Critérios de aceite
- O console deve continuar funcionando com tema padrão sem tenant.
- O tenant white-label deve conseguir sobrescrever tokens por CSS variables.
- Deve existir um campo textarea para `custom_css` no cadastro do tenant.
- O campo `Base Color` deve estar disponível para tenants padrão e white-label.
- O `customCss` deve ser aplicado depois do tema base, com precedência correta.
- O tema deve ser carregado de forma dinâmica sem rebuild da aplicação.
- O carregamento deve respeitar o escopo do tenant e não vazar estilos para outros tenants.

## Fora de escopo
- Editor visual de tema completo nesta fase.
- Preview em tempo real no console nesta fase.
- Sanitização avançada de CSS nesta fase.
- Migração automática de tema antigo para novo schema nesta fase.

## Próximos passos sugeridos
1. Atualizar schema do tenant para suportar `base_color`, `theme_color` e `custom_css`.
2. Criar endpoint `/api/tenant-theme`.
3. Criar helper client-side para aplicar variables e `customCss`.
4. Ajustar `tailwind.config.js` e `globals.css`.
5. Adicionar UI no cadastro do tenant para editar tema e CSS customizado.
