-- Seed: primeiro usuário super_admin do backoffice Vello Finance
--
-- Pré-requisito: criar o usuário no Supabase Dashboard antes de executar este seed.
--   Dashboard → Authentication → Users → Add User
--   E-mail: admin@vellofinance.com.br
--   Senha: (defina uma senha segura)
--
-- Após criar, copie o UUID gerado e substitua abaixo.
-- Depois execute: supabase db reset  (ou aplique manualmente via SQL Editor)

INSERT INTO public.backoffice_users (id, role, full_name)
VALUES (
  '085e83b3-feb1-4fde-8a82-acb35aa38e18',  -- substituir pelo UUID do usuário criado no Dashboard
  'super_admin',
  'Gilberto Bueno'
);
