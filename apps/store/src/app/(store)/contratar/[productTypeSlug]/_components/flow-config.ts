export type StepConfig = {
  slug: string
  label: string
}

export const PRODUCT_FLOWS: Record<string, { etapa1: StepConfig[]; etapa2: StepConfig[] }> = {
  home_equity: {
    etapa1: [
      { slug: 'operacao', label: 'Operação' },
      { slug: 'dados-pessoais', label: 'Dados Pessoais' },
      { slug: 'endereco-garantia', label: 'End. Garantia' },
      { slug: 'endereco-residencial', label: 'End. Residencial' },
      { slug: 'renda-ocupacao', label: 'Renda' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [
      { slug: 'dados-bancarios', label: 'Dados Bancários' },
      { slug: 'documentos-pessoais', label: 'Docs. Pessoais' },
      { slug: 'documentos-imovel', label: 'Docs. Imóvel' },
    ],
  },
  home_equity_pj: {
    etapa1: [
      { slug: 'operacao', label: 'Operação' },
      { slug: 'dados-empresa', label: 'Empresa' },
      { slug: 'atividade-faturamento', label: 'Atividade' },
      { slug: 'dados-socios', label: 'Sócios' },
      { slug: 'endereco-garantia', label: 'End. Garantia' },
      { slug: 'endereco-empresa', label: 'End. Empresa' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [
      { slug: 'dados-bancarios', label: 'Dados Bancários' },
      { slug: 'documentos-empresa', label: 'Docs. Empresa' },
      { slug: 'documentos-pessoais-socios', label: 'Docs. Sócios' },
      { slug: 'documentos-imovel', label: 'Docs. Imóvel' },
    ],
  },
  auto_equity: {
    etapa1: [
      { slug: 'operacao', label: 'Operação' },
      { slug: 'dados-pessoais', label: 'Dados Pessoais' },
      { slug: 'renda-ocupacao', label: 'Renda' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [
      { slug: 'dados-bancarios', label: 'Dados Bancários' },
      { slug: 'documentos-pessoais', label: 'Docs. Pessoais' },
      { slug: 'documentos-veiculo', label: 'Docs. Veículo' },
    ],
  },
  auto_equity_pj: {
    etapa1: [
      { slug: 'operacao', label: 'Operação' },
      { slug: 'dados-empresa', label: 'Empresa' },
      { slug: 'atividade-faturamento', label: 'Atividade' },
      { slug: 'dados-socios', label: 'Sócios' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [
      { slug: 'dados-bancarios', label: 'Dados Bancários' },
      { slug: 'documentos-empresa', label: 'Docs. Empresa' },
      { slug: 'documentos-pessoais-socios', label: 'Docs. Sócios' },
      { slug: 'documentos-veiculo', label: 'Docs. Veículo' },
    ],
  },
  fgts: {
    etapa1: [
      { slug: 'liberacao-saque', label: 'Saque Aniversário' },
      { slug: 'liberacao-bancos', label: 'Autorização Bancos' },
      { slug: 'verificar-margem', label: 'Seus Dados' },
      { slug: 'dados-bancarios', label: 'Dados Bancários' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [],
  },
  capital_giro: {
    etapa1: [
      { slug: 'operacao', label: 'Operação' },
      { slug: 'dados-empresa', label: 'Empresa' },
      { slug: 'dados-socios', label: 'Sócios' },
      { slug: 'garantia', label: 'Garantia' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [
      { slug: 'dados-bancarios', label: 'Dados Bancários' },
      { slug: 'documentos-empresa', label: 'Docs. Empresa' },
      { slug: 'documentos-pessoais-socios', label: 'Docs. Sócios' },
      { slug: 'documentos-garantia', label: 'Docs. Garantia' },
    ],
  },
  antecipacao_recebiveis: {
    etapa1: [
      { slug: 'operacao', label: 'Operação' },
      { slug: 'dados-empresa', label: 'Empresa' },
      { slug: 'dados-socios', label: 'Sócios' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [
      { slug: 'dados-bancarios', label: 'Dados Bancários' },
      { slug: 'documentos-empresa', label: 'Docs. Empresa' },
      { slug: 'documentos-pessoais-socios', label: 'Docs. Sócios' },
      { slug: 'documentos-garantia', label: 'Docs. Recebíveis' },
    ],
  },
  financiamento_imovel: {
    etapa1: [
      { slug: 'operacao', label: 'Operação' },
      { slug: 'dados-solicitante', label: 'Solicitante' },
      { slug: 'atividade-faturamento', label: 'Atividade' },
      { slug: 'dados-socios', label: 'Sócios' },
      { slug: 'dados-vendedor', label: 'Vendedor' },
      { slug: 'endereco-imovel', label: 'End. Imóvel' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [
      { slug: 'dados-bancarios-vendedor', label: 'Dados Bancários' },
      { slug: 'documentos-empresa', label: 'Docs. Empresa' },
      { slug: 'documentos-imovel', label: 'Docs. Imóvel' },
    ],
  },
  financiamento_veiculo: {
    etapa1: [
      { slug: 'operacao', label: 'Operação' },
      { slug: 'dados-pessoais', label: 'Dados Pessoais' },
      { slug: 'renda-ocupacao', label: 'Renda' },
      { slug: 'dados-vendedor', label: 'Vendedor' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [
      { slug: 'dados-bancarios', label: 'Dados Bancários' },
      { slug: 'documentos-pessoais', label: 'Docs. Pessoais' },
      { slug: 'documentos-veiculo', label: 'Docs. Veículo' },
    ],
  },
  consignado_privado: {
    etapa1: [
      { slug: 'pre-filtro', label: 'Qualificação' },
      { slug: 'autorizacao-dataprev', label: 'Autorização' },
      { slug: 'dados-pessoais', label: 'Dados Pessoais' },
      { slug: 'dados-profissionais', label: 'Emprego' },
      { slug: 'dados-bancarios', label: 'Dados Bancários' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [],
  },
}

export const URL_TO_DB_SLUG: Record<string, string> = {
  'home-equity': 'home_equity',
  'home-equity-pj': 'home_equity_pj',
  'auto-equity': 'auto_equity',
  'auto-equity-pj': 'auto_equity_pj',
  'fgts': 'fgts',
  'capital-de-giro': 'capital_giro',
  'antecipacao-recebiveis': 'antecipacao_recebiveis',
  'financiamento-imovel': 'financiamento_imovel',
  'financiamento-veiculo': 'financiamento_veiculo',
  'consignado-clt': 'consignado_privado',
}

export const DB_TO_URL_SLUG: Record<string, string> = {
  home_equity: 'home-equity',
  home_equity_pj: 'home-equity-pj',
  auto_equity: 'auto-equity',
  auto_equity_pj: 'auto-equity-pj',
  fgts: 'fgts',
  capital_giro: 'capital-de-giro',
  antecipacao_recebiveis: 'antecipacao-recebiveis',
  financiamento_imovel: 'financiamento-imovel',
  financiamento_veiculo: 'financiamento-veiculo',
  consignado_privado: 'consignado-clt',
}
