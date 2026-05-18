ALTER TABLE proposals
  DROP CONSTRAINT proposals_status_check;

ALTER TABLE proposals
  ADD CONSTRAINT proposals_status_check
  CHECK (status IN (
    'nova_proposta',
    'proposta_criada',
    'em_analise',
    'pre_aprovada',
    'necessita_detalhes',
    'reprovada',
    'aprovada'
  ));
