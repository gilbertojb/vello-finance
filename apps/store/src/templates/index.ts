import { defaultTemplate } from './default/config'
import { zpTemplate }      from './zp/config'
import type { TemplateConfig } from './_types'

const registry: Record<string, TemplateConfig> = {
  default: defaultTemplate,
  zp:      zpTemplate,
}

export function getTemplate(templateId: string | null | undefined): TemplateConfig {
  return registry[templateId ?? 'default'] ?? defaultTemplate
}

export type { TemplateConfig, ColorTokens, OklchColor } from './_types'
