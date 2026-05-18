import type { TemplateConfig, TemplateHomeProps } from './_types'

import type { ComponentType } from 'react'

import { defaultTemplate } from './default/config'
import { DefaultHome } from './default/home'

import { zpTemplate } from './zp/config'
import { ZpHome } from './zp/home'

import { zpOldTemplate } from './zp_old/config'
import { ZpOldHome } from './zp_old/home'

const configRegistry: Record<string, TemplateConfig> = {
  default: defaultTemplate,
  zp: zpTemplate,
  zp_old: zpOldTemplate,
}

const homeRegistry: Record<string, ComponentType<TemplateHomeProps>> = {
  default: DefaultHome,
  zp: ZpHome,
  zp_old: ZpOldHome,
}

export function getTemplate(
  templateId: string | null | undefined,
): TemplateConfig {
  return configRegistry[templateId ?? 'default'] ?? defaultTemplate
}

export function getHomeComponent(
  templateId: string | null | undefined,
): ComponentType<TemplateHomeProps> {
  return homeRegistry[templateId ?? 'default'] ?? DefaultHome
}

export type {
  TemplateConfig,
  TemplateHomeProps,
  TemplateHomeProduct,
  ColorTokens,
  OklchColor,
} from './_types'
