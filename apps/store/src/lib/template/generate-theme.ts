import type { ColorTokens } from '@/templates/_types'

function o(l: number, c: number, h: number, alpha?: number): string {
  return alpha !== undefined
    ? `oklch(${l} ${c} ${h} / ${alpha})`
    : `oklch(${l} ${c} ${h})`
}

function round(n: number, decimals = 3): number {
  return Math.round(n * 10 ** decimals) / 10 ** decimals
}

export function generateThemeCss(colors: ColorTokens): string {
  const { primary: p, background: bg, surface: s } = colors

  const darkBg = bg.l < 0.5
  const darkPrimary = p.l < 0.5
  const darkSurface = s.l < 0.5

  // Foreground: contrasts with background
  const fg        = darkBg ? o(0.96, 0.015, bg.h) : o(0.08, 0.01, bg.h)
  const fgAlpha   = darkBg ? o(0.96, 0.015, bg.h, 0.18) : o(0.08, 0.01, bg.h, 0.18)
  const mutedFg   = darkBg ? o(0.72, 0.01, bg.h) : o(0.45, 0.01, bg.h)

  // Card / secondary: slightly offset from background
  const cardL   = round(darkBg ? Math.min(bg.l + 0.04, 1) : Math.max(bg.l - 0.04, 0))
  const card    = o(cardL, bg.c, bg.h)
  const secondL = round(darkBg ? Math.min(bg.l + 0.08, 1) : Math.max(bg.l - 0.08, 0))
  const second  = o(secondL, bg.c, bg.h)

  // Primary foreground: contrasts with primary
  const primaryFg = darkPrimary ? o(0.95, 0.01, p.h) : o(0.2, 0.04, p.h)

  // Surface foreground: contrasts with surface
  const surfaceFg = darkSurface ? o(0.92, 0.02, s.h) : o(0.12, 0.01, s.h)

  return `:root {
  --background:             ${o(bg.l, bg.c, bg.h)};
  --foreground:             ${fg};
  --card:                   ${card};
  --card-foreground:        ${fg};
  --popover:                ${card};
  --popover-foreground:     ${fg};
  --primary:                ${o(p.l, p.c, p.h)};
  --primary-foreground:     ${primaryFg};
  --secondary:              ${second};
  --secondary-foreground:   ${fg};
  --muted:                  ${second};
  --muted-foreground:       ${mutedFg};
  --accent:                 ${o(p.l, p.c, p.h)};
  --accent-foreground:      ${primaryFg};
  --destructive:            oklch(0.577 0.245 27.325);
  --destructive-foreground: ${fg};
  --border:                 ${o(p.l, p.c, p.h, 0.12)};
  --input:                  ${fgAlpha};
  --ring:                   ${o(p.l, p.c, p.h)};
  --surface:                ${o(s.l, s.c, s.h)};
  --surface-foreground:     ${surfaceFg};
}`
}
