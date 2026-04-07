-- Migration: create_auth_hook
-- PostgreSQL function usada como Supabase Auth Hook (custom_access_token).
-- Injeta user_role e tenant_id no JWT antes de emiti-lo.
--
-- Após aplicar esta migration, configurar manualmente no Dashboard:
--   Authentication → Hooks → Add hook: "Custom Access Token"
--   Tipo: PostgreSQL | Schema: public | Function: custom_access_token_hook

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  claims          jsonb;
  backoffice_user record;
  tenant_user     record;
BEGIN
  claims := event->'claims';

  -- Tenta buscar como usuário do backoffice
  SELECT role, is_active INTO backoffice_user
  FROM public.backoffice_users
  WHERE id = (event->>'user_id')::uuid;

  IF backoffice_user.is_active = true THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(backoffice_user.role::text));
    claims := jsonb_set(claims, '{tenant_id}', 'null'::jsonb);
  ELSE
    -- Tenta buscar como usuário de tenant (tabela criada no módulo Console)
    SELECT role, tenant_id, is_active INTO tenant_user
    FROM public.tenant_users
    WHERE id = (event->>'user_id')::uuid;

    IF tenant_user.is_active = true THEN
      claims := jsonb_set(claims, '{user_role}', to_jsonb(tenant_user.role::text));
      claims := jsonb_set(claims, '{tenant_id}', to_jsonb(tenant_user.tenant_id));
    END IF;
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- Segurança: apenas o sistema de autenticação do Supabase pode executar esta função
REVOKE ALL PRIVILEGES ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
