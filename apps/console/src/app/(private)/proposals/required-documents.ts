// apps/console/src/app/(private)/proposals/required-documents.ts

export interface RequiredDoc {
  type: string
  label: string
}

export const REQUIRED_DOCUMENTS: Record<string, RequiredDoc[]> = {
  auto_equity: [
    { type: 'rg_cnh',                  label: 'RG ou CNH (frente e verso)' },
    { type: 'comprovante_estado_civil', label: 'Comprovante de estado civil' },
    { type: 'comprovante_endereco',     label: 'Comprovante de endereço' },
    { type: 'crlv',                    label: 'CRLV do veículo' },
    { type: 'foto_traseira',           label: 'Foto traseira do veículo' },
    { type: 'foto_placa',              label: 'Foto da placa traseira' },
    { type: 'foto_chassi',             label: 'Foto do chassi' },
  ],
  fgts: [],
  consignado_privado: [
    { type: 'rg_cnh',               label: 'RG ou CNH (frente e verso)' },
    { type: 'comprovante_endereco',  label: 'Comprovante de endereço' },
    { type: 'contracheque',         label: 'Contracheque (últimos 3 meses)' },
  ],
  consignado_publico: [
    { type: 'rg_cnh',               label: 'RG ou CNH (frente e verso)' },
    { type: 'comprovante_endereco',  label: 'Comprovante de endereço' },
    { type: 'contracheque',         label: 'Contracheque (últimos 3 meses)' },
    { type: 'margem_consignavel',   label: 'Comprovante de margem consignável' },
  ],
  home_equity: [
    { type: 'rg_cnh',               label: 'RG ou CNH (frente e verso)' },
    { type: 'comprovante_endereco',  label: 'Comprovante de endereço' },
    { type: 'matricula_imovel',     label: 'Matrícula do imóvel atualizada' },
    { type: 'iptu',                 label: 'IPTU do imóvel' },
  ],
}

export function getRequiredDocs(productTypeSlug: string): RequiredDoc[] {
  return REQUIRED_DOCUMENTS[productTypeSlug] ?? []
}
