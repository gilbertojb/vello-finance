import type { Config } from 'tailwindcss'

/**
 * Tailwind CSS base config compartilhado entre todos os apps Vello Finance.
 *
 * Em Tailwind v4, a maior parte da configuração (cores, espaçamentos, tipografia)
 * é feita via CSS usando @theme. Este arquivo exporta apenas configurações JS
 * que não podem ser expressas em CSS (plugins, etc).
 *
 * Uso nos apps:
 *   import baseConfig from '@vello/config/tailwind'
 *   export default { ...baseConfig, content: ['./app/**\/*.{ts,tsx}'] } satisfies Config
 */
const config: Omit<Config, 'content'> = {
  darkMode: 'class',
  plugins: [],
}

export default config
