-- Migration: seed_test_proposals
-- Insere proposals de teste em vários status para validar o console.
-- Usa DO $$ para lidar com dados dinâmicos sem UUIDs hardcoded.
-- Se não houver tenant ativo ou produto disponível, encerra sem erro.

DO $$
DECLARE
  v_tenant_id       UUID;
  v_product_id      UUID;
  v_product_slug    TEXT := 'auto_equity';
  v_sim1_id         UUID;
  v_sim2_id         UUID;
  v_sim3_id         UUID;
  v_sim4_id         UUID;
  v_sim5_id         UUID;
BEGIN
  -- Primeiro tenant ativo
  SELECT id INTO v_tenant_id FROM tenants WHERE status = 'active' LIMIT 1;
  IF v_tenant_id IS NULL THEN
    RAISE NOTICE 'seed_test_proposals: nenhum tenant ativo encontrado, pulando.';
    RETURN;
  END IF;

  -- Produto auto_equity PF
  SELECT p.id INTO v_product_id
  FROM products p
  JOIN product_types pt ON pt.id = p.product_type_id
  WHERE pt.slug = 'auto_equity' AND p.category = 'pessoa_fisica'
  LIMIT 1;

  IF v_product_id IS NULL THEN
    RAISE NOTICE 'seed_test_proposals: produto auto_equity não encontrado, pulando.';
    RETURN;
  END IF;

  -- Criar simulações
  INSERT INTO simulations (tenant_id, product_id, client_name, client_phone, desired_amount, desired_term_months, estimated_rate, estimated_payment, status)
  VALUES (v_tenant_id, v_product_id, 'João Silva', '11999990001', 50000, 36, 0.0189, 2087.50, 'pre_qualificado')
  RETURNING id INTO v_sim1_id;

  INSERT INTO simulations (tenant_id, product_id, client_name, client_phone, desired_amount, desired_term_months, estimated_rate, estimated_payment, status)
  VALUES (v_tenant_id, v_product_id, 'Maria Santos', '11999990002', 80000, 48, 0.0189, 2650.00, 'pre_qualificado')
  RETURNING id INTO v_sim2_id;

  INSERT INTO simulations (tenant_id, product_id, client_name, client_phone, desired_amount, desired_term_months, estimated_rate, estimated_payment, status)
  VALUES (v_tenant_id, v_product_id, 'Pedro Costa', '11999990003', 35000, 24, 0.0199, 1890.00, 'pre_qualificado')
  RETURNING id INTO v_sim3_id;

  INSERT INTO simulations (tenant_id, product_id, client_name, client_phone, desired_amount, desired_term_months, estimated_rate, estimated_payment, status)
  VALUES (v_tenant_id, v_product_id, 'Ana Lima', '11999990004', 120000, 60, 0.0179, 3100.00, 'pre_qualificado')
  RETURNING id INTO v_sim4_id;

  INSERT INTO simulations (tenant_id, product_id, client_name, client_phone, desired_amount, desired_term_months, estimated_rate, estimated_payment, status)
  VALUES (v_tenant_id, v_product_id, 'Carlos Ferreira', '11999990005', 25000, 18, 0.0209, 1750.00, 'pre_qualificado')
  RETURNING id INTO v_sim5_id;

  -- Inserir proposals em diferentes status
  INSERT INTO proposals (
    tenant_id, product_id, product_type_slug, simulation_id,
    status, current_step, client_name, client_phone,
    documents_submitted, form_data, created_at, updated_at
  ) VALUES
    (
      v_tenant_id, v_product_id, v_product_slug, v_sim1_id,
      'em_analise', 'retorno', 'João Silva', '(11) 99999-0001',
      true, '{"operacao": {"valor": 50000, "prazo": 36}}',
      NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'
    ),
    (
      v_tenant_id, v_product_id, v_product_slug, v_sim2_id,
      'pre_aprovada', 'retorno', 'Maria Santos', '(11) 99999-0002',
      true, '{"operacao": {"valor": 80000, "prazo": 48}}',
      NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'
    ),
    (
      v_tenant_id, v_product_id, v_product_slug, v_sim3_id,
      'necessita_detalhes', 'retorno', 'Pedro Costa', '(11) 99999-0003',
      true, '{"operacao": {"valor": 35000, "prazo": 24}}',
      NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'
    ),
    (
      v_tenant_id, v_product_id, v_product_slug, v_sim4_id,
      'aprovada', 'retorno', 'Ana Lima', '(11) 99999-0004',
      true, '{"operacao": {"valor": 120000, "prazo": 60}}',
      NOW() - INTERVAL '10 days', NOW() - INTERVAL '7 days'
    ),
    (
      v_tenant_id, v_product_id, v_product_slug, v_sim5_id,
      'reprovada', 'retorno', 'Carlos Ferreira', '(11) 99999-0005',
      true, '{"operacao": {"valor": 25000, "prazo": 18}}',
      NOW() - INTERVAL '8 days', NOW() - INTERVAL '6 days'
    );

  RAISE NOTICE 'seed_test_proposals: 5 proposals de teste inseridas para tenant %.', v_tenant_id;
END $$;
