# Design System — Vello Finance

## Identidade Visual

Baseado no brand guide oficial da Vello Finance.
Aplicado em: `apps/admin`, `apps/console`, `apps/store`.

---

## Tipografia

**Fonte:** Geist (Vercel) — instalada via pacote `geist`, não via Google Fonts.

```bash
pnpm add geist --filter=admin --filter=console --filter=store
```

### Configuração no Next.js

```typescript
// apps/[admin|console|store]/app/layout.tsx
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

### Escala tipográfica

| Token | Tamanho | Peso | Uso |
|---|---|---|---|
| `text-xs` | 11px | 400 | Labels de tabela, badges |
| `text-sm` | 12px | 400 | Texto de corpo, células de tabela |
| `text-base` | 13px | 400 | Texto padrão de UI |
| `text-md` | 14px | 500 | Títulos de seção, topbar |
| `text-lg` | 16px | 500 | Headings de card |
| `text-xl` | 20px | 600 | Valores de métricas |
| `text-2xl` | 24px | 600 | Valores grandes de dashboard |
| `text-display` | 32px+ | 600 | Títulos de página (raros no admin) |

---

## Paleta de Cores

### Cores da Marca (brand guide)

```typescript
// packages/config/src/tokens.ts
export const velloColors = {
  // Primárias
  blue: {
    DEFAULT: '#3B5BBE',   // Azul principal Vello
    light:   '#5C7EDB',   // Hover states, variações
    dark:    '#2A4491',   // Active states, pressed
    subtle:  '#EEF2FF',   // Backgrounds sutis (light mode)
  },
  navy: '#1E3A5F',        // Cor secundária escura
  sky:  '#7EC8E3',        // Accent / highlight
  // Neutros
  gray: {
    bg:     '#F0F2F7',    // Background da página (light)
    border: '#E4E7F0',    // Bordas (light)
  },
}
```

### Mapeamento para CSS Variables (shadcn)

O shadcn usa CSS variables no padrão HSL. Mapeamento da paleta Vello:

```
Azul Vello #3B5BBE → hsl(228, 51%, 48%)
Azul Light #5C7EDB → hsl(224, 62%, 61%)
Azul Dark  #2A4491 → hsl(228, 54%, 37%)
Navy       #1E3A5F → hsl(214, 52%, 24%)
Sky        #7EC8E3 → hsl(198, 63%, 69%)
```

### Temas Light e Dark

```css
/* apps/admin/app/globals.css */

:root {
  /* Brand */
  --vello-blue:        228 51% 48%;
  --vello-blue-light:  224 62% 61%;
  --vello-blue-dark:   228 54% 37%;
  --vello-navy:        214 52% 24%;
  --vello-sky:         198 63% 69%;

  /* shadcn tokens — Light Mode */
  --background:         0 0% 100%;
  --foreground:         222 47% 11%;

  --card:               0 0% 100%;
  --card-foreground:    222 47% 11%;

  --popover:            0 0% 100%;
  --popover-foreground: 222 47% 11%;

  --primary:            228 51% 48%;      /* Azul Vello */
  --primary-foreground: 0 0% 100%;

  --secondary:          220 14% 96%;
  --secondary-foreground: 222 47% 11%;

  --muted:              220 14% 96%;
  --muted-foreground:   220 9% 46%;

  --accent:             228 51% 48%;
  --accent-foreground:  0 0% 100%;

  --destructive:        0 84% 60%;
  --destructive-foreground: 0 0% 100%;

  --border:             220 13% 90%;
  --input:              220 13% 90%;
  --ring:               228 51% 48%;

  --radius: 0.5rem;

  /* Layout */
  --sidebar-width:      220px;
  --topbar-height:      52px;
  --content-padding:    20px;
}

.dark {
  /* shadcn tokens — Dark Mode (Zinc) */
  --background:         240 10% 4%;       /* zinc-950 #09090b */
  --foreground:         0 0% 95%;

  --card:               240 6% 10%;       /* zinc-900 #18181b */
  --card-foreground:    0 0% 95%;

  --popover:            240 6% 10%;
  --popover-foreground: 0 0% 95%;

  --primary:            224 62% 61%;      /* Azul mais claro no dark */
  --primary-foreground: 0 0% 100%;

  --secondary:          240 4% 16%;       /* zinc-800 */
  --secondary-foreground: 0 0% 95%;

  --muted:              240 4% 16%;
  --muted-foreground:   240 5% 65%;

  --accent:             240 4% 16%;
  --accent-foreground:  0 0% 95%;

  --destructive:        0 63% 31%;
  --destructive-foreground: 0 0% 95%;

  --border:             240 4% 16%;       /* zinc-800 */
  --input:              240 4% 16%;
  --ring:               224 62% 61%;
}
```

---

## Configuração do Tailwind

```typescript
// packages/config/tailwind.base.ts
import type { Config } from 'tailwindcss'

export const tailwindBase: Partial<Config> = {
  darkMode: ['class'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        // Cores da marca Vello (uso direto em classes)
        vello: {
          blue:   '#3B5BBE',
          light:  '#5C7EDB',
          dark:   '#2A4491',
          navy:   '#1E3A5F',
          sky:    '#7EC8E3',
          subtle: '#EEF2FF',
        },
        // Alias para shadcn (CSS variables)
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg:  'var(--radius)',
        md:  'calc(var(--radius) - 2px)',
        sm:  'calc(var(--radius) - 4px)',
      },
    },
  },
}
```

```typescript
// apps/admin/tailwind.config.ts
import type { Config } from 'tailwindcss'
import { tailwindBase } from '@vello/config/tailwind'

const config: Config = {
  ...tailwindBase,
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/config/src/**/*.{ts,tsx}',
  ],
}

export default config
```

---

## Componentes Base (shadcn)

### Instalação por app

```bash
# Instalar componentes usados no Admin (instalar conforme necessário)
cd apps/admin
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add select
npx shadcn@latest add switch
npx shadcn@latest add form
npx shadcn@latest add tooltip
npx shadcn@latest add separator
npx shadcn@latest add avatar
npx shadcn@latest add sonner
```

### Componentes customizados (já presentes — não reinstalar via shadcn)

| Componente | Arquivo | Descrição |
|---|---|---|
| `Badge` | `components/ui/badge.tsx` | Status badges com variantes cva |
| `Toggle` | `components/ui/toggle.tsx` | Botão toggle acessível (Radix) |
| `ToggleGroup` | `components/ui/toggle-group.tsx` | Grupo de toggles exclusivos |
| `ButtonGroup` | `components/ui/button-group.tsx` | Agrupa botões relacionados |

### Customizações da marca aplicadas via CSS variables

Não editar os arquivos do shadcn em `components/ui/` diretamente.
Customizações de cor são feitas via `globals.css` nos CSS variables mapeados acima.

---

## Status Badges — Padrão de Cores

| Status | Light bg | Light text | Dark bg | Dark text | Uso |
|---|---|---|---|---|---|
| `active` | `#DCFCE7` | `#166534` | `#14532D` | `#86EFAC` | Tenant ativo, proposta paga |
| `pending` | `#FEF9C3` | `#854D0E` | `#422006` | `#FDE047` | Aguardando ação |
| `suspended` | `#FEE2E2` | `#991B1B` | `#450A0A` | `#FCA5A5` | Suspenso |
| `cancelled` | `#F1F5F9` | `#64748B` | `#27272A` | `#71717A` | Cancelado |
| `approved` | `#DCFCE7` | `#166534` | `#14532D` | `#86EFAC` | Proposta aprovada |
| `rejected` | `#FEE2E2` | `#991B1B` | `#450A0A` | `#FCA5A5` | Proposta reprovada |
| `info` | `#EEF2FF` | `#3B5BBE` | `#1E2D5A` | `#7B9EEE` | Informativo / neutro |
