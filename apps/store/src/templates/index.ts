import { defaultTemplate } from './default/config'
import { zpTemplate }      from './zp/config'
import { DefaultHome }     from './default/home'
import { ZpHome }          from './zp/home'
import type { TemplateConfig, TemplateHomeProps } from './_types'
import type { ComponentType } from 'react'

const configRegistry: Record<string, TemplateConfig> = {
  default: defaultTemplate,
  zp:      zpTemplate,
}

const homeRegistry: Record<string, ComponentType<TemplateHomeProps>> = {
  default: DefaultHome,
  zp:      ZpHome,
}

export function getTemplate(templateId: string | null | undefined): TemplateConfig {
  return configRegistry[templateId ?? 'default'] ?? defaultTemplate
}

export function getHomeComponent(templateId: string | null | undefined): ComponentType<TemplateHomeProps> {
  return homeRegistry[templateId ?? 'default'] ?? DefaultHome
}

export type { TemplateConfig, TemplateHomeProps, TemplateHomeProduct, ColorTokens, OklchColor } from './_types'
