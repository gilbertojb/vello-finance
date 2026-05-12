import type { TemplateConfig } from '../_types'

export const zpTemplate: TemplateConfig = {
  id:          'zp',
  displayName: 'ZP Pay',

  // Cores do design ZP Pay: background marrom escuro, surface off-white quente, primary âmbar
  colors: {
    primary:    { l: 0.83, c: 0.10,  h: 85 },
    background: { l: 0.13, c: 0.015, h: 45 },
    surface:    { l: 0.97, c: 0.01,  h: 85 },
  },

  layout: {
    hero: 'split',
  },

  content: {
    hero: {
      eyebrow:  'Soluções de Crédito',
      headline: 'Crédito inteligente para realizar seus planos',
      lede:     'Simule gratuitamente, compare condições e avance na contratação com total segurança. Rápido, digital e sem burocracia.',
    },
    cta: {
      title:       'Simule sem compromisso',
      description: 'Escolha seu produto, informe o valor e veja sua parcela em segundos. Sem cadastro, sem consulta ao CPF.',
    },
    productsSection: {
      title:       'Nossas linhas de crédito',
      description: 'Encontre a linha ideal para o seu momento — do crédito pessoal ao home equity.',
    },
    howItWorks: {
      title: 'Como funciona',
      steps: [
        {
          title:       'Simule gratuitamente',
          description: 'Escolha o produto, ajuste valor e prazo e veja a parcela em tempo real.',
          icon:        'Calculator',
        },
        {
          title:       'Preencha seus dados',
          description: 'Formulário rápido, sem consulta ao CPF e sem compromisso.',
          icon:        'ClipboardList',
        },
        {
          title:       'Receba o contato',
          description: 'Nossa equipe retorna em até 24 horas com a melhor condição disponível.',
          icon:        'BadgeCheck',
        },
      ],
    },
  },

  navigation: {
    header: [
      { label: 'Produtos',      href: '#produtos'      },
      { label: 'Como funciona', href: '#como-funciona' },
      { label: 'Sobre',         href: '#sobre'         },
    ],
    footer: [
      { label: 'Privacidade', href: '/privacidade' },
      { label: 'Termos',      href: '/termos'      },
      { label: 'Suporte',     href: '/suporte'     },
    ],
    footerTagline: 'Crédito inteligente para realizar seus planos.',
  },
}
