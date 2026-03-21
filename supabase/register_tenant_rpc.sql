-- ═══════════════════════════════════════════════════════════════════════════
-- RPC: register_new_tenant
-- Crea un tenant (periodo trial 3 días) y un perfil admin en una sola llamada.
-- SECURITY DEFINER → se ejecuta con permisos del owner (bypassea RLS).
-- Llamada desde el cliente anon después de supabase.auth.signUp().
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.register_new_tenant(
  p_user_id            uuid,
  p_company_name       text,
  p_company_rut        text,
  p_address            text,
  p_phone              text,
  p_establishment_type text,
  p_admin_name         text,
  p_admin_rut          text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Validaciones básicas
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id no puede ser NULL';
  END IF;
  IF trim(p_company_name) = '' THEN
    RAISE EXCEPTION 'El nombre de la empresa es obligatorio';
  END IF;

  -- 1. Crear el tenant en período trial (3 días)
  INSERT INTO tenants (
    name, rut, address, phone, type,
    plan, plan_expires_at, active
  )
  VALUES (
    trim(p_company_name),
    trim(p_company_rut),
    trim(p_address),
    trim(p_phone),
    p_establishment_type,
    'trial',
    now() + interval '3 days',
    true
  )
  RETURNING id INTO v_tenant_id;

  -- 2. Crear el perfil administrador
  INSERT INTO profiles (
    id, tenant_id, full_name, rut, role, active
  )
  VALUES (
    p_user_id,
    v_tenant_id,
    trim(p_admin_name),
    trim(p_admin_rut),
    'admin',
    true
  );

END;
$$;

-- Permisos: anon y authenticated pueden llamar la función
GRANT EXECUTE ON FUNCTION public.register_new_tenant(
  uuid, text, text, text, text, text, text, text
) TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICAR que la columna plan_expires_at existe en tenants.
-- Si no existe, agregarla:
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

-- ═══════════════════════════════════════════════════════════════════════════
-- OPCIONAL: actualizar el tenant de prueba existente a los nuevos nombres
-- (RestoBPM ya existe con plan='pro', lo mantenemos para Oscar superadmin)
-- ═══════════════════════════════════════════════════════════════════════════
-- UPDATE tenants SET plan = 'total' WHERE name = 'RestoBPM';
