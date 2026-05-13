ALTER TABLE product_types
  ADD COLUMN category TEXT CHECK (
    category IN ('pessoa_fisica','pessoa_juridica','financiamentos')
  );

UPDATE product_types SET category = 'pessoa_fisica'
  WHERE slug IN ('fgts','consignado_publico','consignado_privado',
                 'home_equity','auto_equity','emprestimo_pessoal','conta_luz','outros');

UPDATE product_types SET category = 'pessoa_juridica'
  WHERE slug IN ('home_equity_pj','auto_equity_pj',
                 'capital_giro','antecipacao_recebiveis');

UPDATE product_types SET category = 'financiamentos'
  WHERE slug IN ('financiamento_imovel','financiamento_veiculo');
