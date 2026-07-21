# Design System — Vello Finance

## Visual Identity

Based on the official Vello Finance brand guide.
Applied in: `apps/admin`, `apps/console`, `apps/store`.

---

## Typography

**Font:** Geist (Vercel) — installed via the `geist` package, not via Google Fonts.

```bash
pnpm add geist --filter=admin --filter=console --filter=store
```

### Next.js Configuration

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

### Type scale

| Token | Size | Weight | Use |
|---|---|---|---|
| `text-xs` | 11px | 400 | Table labels, badges |
| `text-sm` | 12px | 400 | Body text, table cells |
| `text-base` | 13px | 400 | Default UI text |
| `text-md` | 14px | 500 | Section titles, topbar |
| `text-lg` | 16px | 500 | Card headings |
| `text-xl` | 20px | 600 | Metric values |
| `text-2xl` | 24px | 600 | Large dashboard values |
| `text-display` | 32px+ | 600 | Page titles (rare in admin) |

---

## Color Palette

### Brand Colors (brand guide)

```typescript
// packages/config/src/tokens.ts
export const velloColors = {
  // Primary
  blue: {
    DEFAULT: '#3B5BBE',   // Vello main blue
    light:   '#5C7EDB',   // Hover states, variations
    dark:    '#2A4491',   // Active states, pressed
    subtle:  '#EEF2FF',   // Subtle backgrounds (light mode)
  },
  navy: '#1E3A5F',        // Dark secondary color
  sky:  '#7EC8E3',        // Accent / highlight
  // Neutrals
  gray: {
    bg:     '#F0F2F7',    // Page background (light)
    border: '#E4E7F0',    // Borders (light)
  },
}
```

### Mapping to CSS Variables (shadcn)

shadcn uses CSS variables in HSL format. Mapping of the Vello palette:

```
Vello Blue #3B5BBE → hsl(228, 51%, 48%)
Light Blue #5C7EDB → hsl(224, 62%, 61%)
Dark Blue  #2A4491 → hsl(228, 54%, 37%)
Navy       #1E3A5F → hsl(214, 52%, 24%)
Sky        #7EC8E3 → hsl(198, 63%, 69%)
```

### Light and Dark Themes

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

  --primary:            228 51% 48%;      /* Vello Blue */
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

  --primary:            224 62% 61%;      /* Lighter blue in dark mode */
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

## Tailwind Configuration

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
        // Vello brand colors (used directly in classes)
        vello: {
          blue:   '#3B5BBE',
          light:  '#5C7EDB',
          dark:   '#2A4491',
          navy:   '#1E3A5F',
          sky:    '#7EC8E3',
          subtle: '#EEF2FF',
        },
        // Alias for shadcn (CSS variables)
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

## Base Components (shadcn)

### Installation per app

```bash
# Install components used in Admin (install as needed)
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

### Custom components (already present — do not reinstall via shadcn)

| Component | File | Description |
|---|---|---|
| `Badge` | `components/ui/badge.tsx` | Status badges with cva variants |
| `Toggle` | `components/ui/toggle.tsx` | Accessible toggle button (Radix) |
| `ToggleGroup` | `components/ui/toggle-group.tsx` | Group of exclusive toggles |
| `ButtonGroup` | `components/ui/button-group.tsx` | Groups related buttons |

### Brand customizations applied via CSS variables

Do not edit shadcn files in `components/ui/` directly.
Color customizations are made via `globals.css` in the CSS variables mapped above.

---

## Status Badges — Color Pattern

| Status | Light bg | Light text | Dark bg | Dark text | Use |
|---|---|---|---|---|---|
| `active` | `#DCFCE7` | `#166534` | `#14532D` | `#86EFAC` | Active tenant, paid proposal |
| `pending` | `#FEF9C3` | `#854D0E` | `#422006` | `#FDE047` | Awaiting action |
| `suspended` | `#FEE2E2` | `#991B1B` | `#450A0A` | `#FCA5A5` | Suspended |
| `cancelled` | `#F1F5F9` | `#64748B` | `#27272A` | `#71717A` | Cancelled |
| `approved` | `#DCFCE7` | `#166534` | `#14532D` | `#86EFAC` | Approved proposal |
| `rejected` | `#FEE2E2` | `#991B1B` | `#450A0A` | `#FCA5A5` | Rejected proposal |
| `info` | `#EEF2FF` | `#3B5BBE` | `#1E2D5A` | `#7B9EEE` | Informational / neutral |
