-- ══════════════════════════════════════════════════════════════════
-- CIFRADO DE RUT Y DATOS SENSIBLES — Ley 19.628
-- Estrategia: cifrado simétrico AES-256 vía pgcrypto.
-- La clave de cifrado se gestiona como secreto en Supabase Vault
-- o como variable de entorno de las Edge Functions.
-- ══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Funciones de cifrado/descifrado ─────────────────────────────
-- Nota: APP_ENCRYPTION_KEY debe ser un secreto en Supabase Vault.
-- Durante la transición, el RUT se almacena cifrado en rut_encrypted
-- y en texto plano en rut (para compatibilidad). Cuando todos los
-- RUTs estén migrados, se eliminará la columna rut.

-- Cifrar texto con AES-256-CBC
CREATE OR REPLACE FUNCTION encrypt_sensitive(plaintext TEXT)
RETURNS BYTEA AS $$
BEGIN
  IF plaintext IS NULL OR trim(plaintext) = '' THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_encrypt(
    plaintext,
    current_setting('app.encryption_key', true),
    'compress-algo=1, cipher-algo=aes256'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Descifrar dato AES-256-CBC
CREATE OR REPLACE FUNCTION decrypt_sensitive(ciphertext BYTEA)
RETURNS TEXT AS $$
BEGIN
  IF ciphertext IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN pgp_sym_decrypt(
    ciphertext,
    current_setting('app.encryption_key', true)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN NULL; -- no filtrar errores de clave
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Agregar columnas cifradas a profiles ────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rut_encrypted BYTEA;

-- ─── Agregar columna cifrada a workers ───────────────────────────
ALTER TABLE workers
  ADD COLUMN IF NOT EXISTS rut_encrypted BYTEA;

-- ─── Función para migrar RUTs existentes ─────────────────────────
-- EJECUTAR DESPUÉS de configurar app.encryption_key en Supabase:
--   SET app.encryption_key = '<tu_clave_secreta>';
--   SELECT migrate_ruts_to_encrypted();
--
CREATE OR REPLACE FUNCTION migrate_ruts_to_encrypted()
RETURNS TEXT AS $$
DECLARE
  v_count_profiles INT := 0;
  v_count_workers  INT := 0;
BEGIN
  -- Migrar profiles
  UPDATE profiles
  SET rut_encrypted = encrypt_sensitive(rut)
  WHERE rut IS NOT NULL
    AND rut_encrypted IS NULL;
  GET DIAGNOSTICS v_count_profiles = ROW_COUNT;

  -- Migrar workers
  UPDATE workers
  SET rut_encrypted = encrypt_sensitive(rut)
  WHERE rut IS NOT NULL
    AND rut_encrypted IS NULL;
  GET DIAGNOSTICS v_count_workers = ROW_COUNT;

  RETURN format('Migrados: %s perfiles, %s trabajadores', v_count_profiles, v_count_workers);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Vista con RUT descifrado (solo para lectura autenticada) ─────
-- La vista descifra el RUT al vuelo para el usuario autenticado
-- Solo expone datos del tenant propio (RLS aplicado en tablas base)
CREATE OR REPLACE VIEW v_profiles_decrypted AS
SELECT
  id, tenant_id, full_name, role, active, created_at,
  COALESCE(decrypt_sensitive(rut_encrypted), rut) AS rut
FROM profiles
WHERE tenant_id = public.get_my_tenant_id();

CREATE OR REPLACE VIEW v_workers_decrypted AS
SELECT
  id, tenant_id, name, shift, active, order_index, created_at,
  COALESCE(decrypt_sensitive(rut_encrypted), rut) AS rut
FROM workers
WHERE tenant_id = public.get_my_tenant_id();

GRANT SELECT ON v_profiles_decrypted TO authenticated;
GRANT SELECT ON v_workers_decrypted  TO authenticated;

-- ─── Trigger: auto-cifrar RUT al insertar/actualizar ─────────────
CREATE OR REPLACE FUNCTION auto_encrypt_rut()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rut IS NOT NULL AND trim(NEW.rut) <> '' THEN
    NEW.rut_encrypted := encrypt_sensitive(NEW.rut);
    -- En producción post-migración: descomentar para dejar columna vacía
    -- NEW.rut := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS encrypt_rut_profiles ON profiles;
CREATE TRIGGER encrypt_rut_profiles
  BEFORE INSERT OR UPDATE OF rut ON profiles
  FOR EACH ROW EXECUTE FUNCTION auto_encrypt_rut();

DROP TRIGGER IF EXISTS encrypt_rut_workers ON workers;
CREATE TRIGGER encrypt_rut_workers
  BEFORE INSERT OR UPDATE OF rut ON workers
  FOR EACH ROW EXECUTE FUNCTION auto_encrypt_rut();

-- ══════════════════════════════════════════════════════════════════
-- INSTRUCCIONES POST-DEPLOY:
-- 1. En Supabase Dashboard → Settings → Vault:
--    Crear secreto: app.encryption_key = '<clave-aleatoria-32-bytes>'
-- 2. En SQL Editor ejecutar:
--    SET app.encryption_key = '<tu_clave>';
--    SELECT migrate_ruts_to_encrypted();
-- 3. Verificar que v_profiles_decrypted y v_workers_decrypted retornan
--    RUTs correctos antes de eliminar columna rut original.
-- ══════════════════════════════════════════════════════════════════
