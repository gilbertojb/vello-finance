-- Corrige proposals de produtos sem etapa2 (FGTS e Consignado CLT)
-- que ficaram em 'proposta_criada' quando deveriam estar em 'em_analise'.
-- Inclui a proposta b0a603b9-faf8-4873-ad0d-956229b70905 e qualquer outra no mesmo estado.

UPDATE proposals
SET status = 'em_analise', updated_at = NOW()
WHERE status = 'proposta_criada'
  AND product_type_slug IN ('fgts', 'consignado_privado');
