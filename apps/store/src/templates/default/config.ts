import type { TemplateConfig } from '../_types'

export const defaultTemplate: TemplateConfig = {
  id:          'default',
  displayName: 'Vello Store',

  colors: {
    primary:    { l: 0.48, c: 0.25, h: 258 },
    background: { l: 0.35, c: 0.18, h: 258 },
    surface:    { l: 0.42, c: 0.17, h: 258 },
  },

  layout: {
    hero: 'split',
  },

  content: {
    hero: {
      eyebrow:  '{{displayName}} · Crédito feito para você',
      headline: 'Crédito que honra quem você é.',
      lede:     'Empréstimos pessoais, consignados, FGTS e linhas com garantia — taxas competitivas, aprovação digital e respeito por cada história. Simule em 60 segundos.',
    },
    cta: {
      title:       'Simule sem compromisso',
      description: 'Escolha seu produto, informe o valor e veja sua parcela em segundos. Sem cadastro, sem consulta ao CPF — só você no controle.',
      testimonial: {
        text:   'O atendimento me trouxe segurança desde o primeiro contato. Aprovação rápida e taxa justa.',
        author: 'Marcus R. — cliente desde 2024',
      },
    },
    productsSection: {
      title:       'Nossas linhas de crédito',
      description: 'Linhas distintas, do consignado ao home equity — encontre a que faz sentido para o seu momento.',
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
          title:       'Envie seus dados',
          description: 'Preencha o formulário em menos de 2 minutos, sem consulta ao CPF.',
          icon:        'ClipboardList',
        },
        {
          title:       'Receba a aprovação',
          description: 'Nossa equipe entra em contato em até 24 horas com a melhor condição.',
          icon:        'BadgeCheck',
        },
      ],
    },
  },

  navigation: {
    header: [
      { label: 'Produtos',       href: '#produtos'      },
      { label: 'Como funciona',  href: '#como-funciona' },
      { label: 'Sobre',          href: '#sobre'          },
    ],
    footer: [
      { label: 'Privacidade', href: '/privacidade' },
      { label: 'Termos',      href: '/termos'      },
      { label: 'Suporte',     href: '/suporte'     },
    ],
    footerTagline: 'Crédito com respeito.',
  },
}
