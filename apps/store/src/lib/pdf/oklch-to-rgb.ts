function clamp(x: number): number {
  return Math.max(0, Math.min(1, x))
}

function linearToSrgb(x: number): number {
  const c = clamp(x)
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

function toHex(x: number): string {
  return Math.round(clamp(x) * 255).toString(16).padStart(2, '0')
}

export function oklchToHex(l: number, c: number, h: number): string {
  const hRad = (h * Math.PI) / 180
  const a = c * Math.cos(hRad)
  const b = c * Math.sin(hRad)

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b

  const L = l_ * l_ * l_
  const M = m_ * m_ * m_
  const S = s_ * s_ * s_

  const r = linearToSrgb(+4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S)
  const g = linearToSrgb(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S)
  const bC = linearToSrgb(-0.0041960863 * L - 0.7034186147 * M + 1.7076147010 * S)

  return `#${toHex(r)}${toHex(g)}${toHex(bC)}`
}
