-- Migration: postgres_custom_access_token_hook
-- Descrição: Transforma a Edge Function de auth hook em uma Postgres Function segura

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
  DECLARE
    claims jsonb;
    backoffice_user record;
    tenant_user record;
  BEGIN
    claims := event->'claims';

    -- Tenta buscar como usuário do backoffice
    SELECT role, is_active INTO backoffice_user
    FROM public.backoffice_users
    WHERE id = (event->>'user_id')::uuid;

    IF backoffice_user.is_active = true THEN
      claims := jsonb_set(claims, '{user_role}', to_jsonb(backoffice_user.role));
      claims := jsonb_set(claims, '{tenant_id}', 'null'::jsonb);
    ELSE
      -- Tenta buscar como usuário de tenant
      SELECT role, tenant_id, is_active INTO tenant_user
      FROM public.tenant_users
      WHERE id = (event->>'user_id')::uuid;

      IF tenant_user.is_active = true THEN
        claims := jsonb_set(claims, '{user_role}', to_jsonb(tenant_user.role));
        claims := jsonb_set(claims, '{tenant_id}', to_jsonb(tenant_user.tenant_id));
      END IF;
    END IF;

    -- Atualiza o objeto claims no evento original
    event := jsonb_set(event, '{claims}', claims);
    
    RETURN event;
  END;
$$;

-- Revoga acesso público para segurança
REVOKE ALL PRIVILEGES ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC;
-- Concede permissão apenas ao sistema de autenticação
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
