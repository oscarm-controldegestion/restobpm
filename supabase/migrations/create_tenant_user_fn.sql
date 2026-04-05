-- ============================================================
-- create_tenant_user: Postgres RPC (reemplaza Edge Function)
-- Crea un usuario operador/supervisor dentro de un tenant.
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- Asegurar que pgcrypto esté disponible (normalmente ya está en Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Eliminar versión anterior si existe
DROP FUNCTION IF EXISTS public.create_tenant_user(TEXT, TEXT, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.create_tenant_user(
  p_email      TEXT,
  p_full_name  TEXT,
  p_rut        TEXT,
  p_role       TEXT,
  p_tenant_id  UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id     UUID;
  v_caller_role   TEXT;
  v_caller_tenant UUID;
  v_new_user_id   UUID;
  v_temp_password TEXT;
  v_chars         TEXT := 'abcdefghjkmnpqrstuvwxyz';
  v_upper         TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_digits        TEXT := '23456789';
  v_special       TEXT := '!@#$%&*';
  v_random_bytes  BYTEA;
  i               INT;
BEGIN
  -- 1. Obtener usuario autenticado
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('error', 'No autorizado');
  END IF;

  -- 2. Verificar que el llamador es admin activo del tenant indicado
  SELECT role, tenant_id INTO v_caller_role, v_caller_tenant
  FROM public.profiles
  WHERE id = v_caller_id AND active = true;

  IF NOT FOUND OR v_caller_role <> 'admin' OR v_caller_tenant <> p_tenant_id THEN
    RETURN json_build_object('error', 'Solo el administrador del establecimiento puede crear usuarios');
  END IF;

  -- 3. Validar inputs
  IF p_email IS NULL OR trim(p_email) = '' OR
     p_full_name IS NULL OR trim(p_full_name) = '' OR
     p_role IS NULL OR p_tenant_id IS NULL THEN
    RETURN json_build_object('error', 'email, fullName, role y tenantId son requeridos');
  END IF;

  IF p_role NOT IN ('operator', 'supervisor') THEN
    RETURN json_build_object('error', 'Rol no válido. Usa: operator, supervisor');
  END IF;

  -- 4. Verificar que el correo no esté ya registrado
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = lower(trim(p_email)) AND deleted_at IS NULL) THEN
    RETURN json_build_object('error', 'Este correo electrónico ya está registrado en el sistema.');
  END IF;

  -- 5. SECURE password generation using gen_random_bytes (cryptographic PRNG)
  -- 12 chars: 6 lowercase + 2 uppercase + 2 digits + 1 special + 1 extra
  v_random_bytes := gen_random_bytes(12);
  v_temp_password := '';
  FOR i IN 0..5 LOOP
    v_temp_password := v_temp_password ||
      substr(v_chars, 1 + (get_byte(v_random_bytes, i) % length(v_chars)), 1);
  END LOOP;
  v_temp_password := v_temp_password ||
    substr(v_upper, 1 + (get_byte(v_random_bytes, 6) % length(v_upper)), 1);
  v_temp_password := v_temp_password ||
    substr(v_upper, 1 + (get_byte(v_random_bytes, 7) % length(v_upper)), 1);
  v_temp_password := v_temp_password ||
    substr(v_digits, 1 + (get_byte(v_random_bytes, 8) % length(v_digits)), 1);
  v_temp_password := v_temp_password ||
    substr(v_digits, 1 + (get_byte(v_random_bytes, 9) % length(v_digits)), 1);
  v_temp_password := v_temp_password ||
    substr(v_special, 1 + (get_byte(v_random_bytes, 10) % length(v_special)), 1);
  v_temp_password := v_temp_password ||
    substr(v_chars, 1 + (get_byte(v_random_bytes, 11) % length(v_chars)), 1);

  -- 6. Crear usuario en auth.users
  v_new_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    is_super_admin,
    is_sso_user
  ) VALUES (
    v_new_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    lower(trim(p_email)),
    crypt(v_temp_password, gen_salt('bf')),
    now(),                                          -- email confirmado de inmediato
    json_build_object('full_name', trim(p_full_name))::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(),
    now(),
    false,
    false
  );

  -- 7. Insertar identidad (necesario para inicio de sesión)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_new_user_id,
    json_build_object('sub', v_new_user_id::text, 'email', lower(trim(p_email)))::jsonb,
    'email',
    lower(trim(p_email)),
    now(),
    now(),
    now()
  );

  -- 8. Crear perfil en el tenant
  INSERT INTO public.profiles (id, tenant_id, full_name, rut, role, active)
  VALUES (
    v_new_user_id,
    p_tenant_id,
    trim(p_full_name),
    NULLIF(trim(coalesce(p_rut, '')), ''),
    p_role,
    true
  );

  RETURN json_build_object('userId', v_new_user_id, 'tempPassword', v_temp_password);

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('error', 'Este correo electrónico ya está registrado en el sistema.');
  WHEN OTHERS THEN
    RETURN json_build_object('error', 'Error al crear usuario: ' || SQLERRM);
END;
$$;

-- Permitir que usuarios autenticados llamen la función
GRANT EXECUTE ON FUNCTION public.create_tenant_user(TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
