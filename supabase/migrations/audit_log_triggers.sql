-- ══════════════════════════════════════════════════════════════════
-- AUDIT LOG — Triggers automáticos en tablas críticas
-- Ley 19.799: integridad e inalterabilidad de registros electrónicos
-- Ley 20.393: trazabilidad forense
-- ══════════════════════════════════════════════════════════════════

-- Asegurar estructura completa de audit_log (columna entity_id puede
-- ser distinta de record_id según el schema inicial)
ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS entity      TEXT,
  ADD COLUMN IF NOT EXISTS entity_id   UUID,
  ADD COLUMN IF NOT EXISTS performed_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS details     JSONB;

-- Índices para consultas rápidas de auditoría
CREATE INDEX IF NOT EXISTS idx_audit_tenant     ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity     ON audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_performed  ON audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_created    ON audit_log(created_at DESC);

-- ─── Función genérica de trigger de auditoría ────────────────────
CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id   UUID;
  v_action    TEXT;
  v_old_data  JSONB;
  v_new_data  JSONB;
BEGIN
  -- Obtener usuario actual
  v_user_id := auth.uid();

  -- Extraer tenant_id según la operación
  IF TG_OP = 'DELETE' THEN
    v_tenant_id := (row_to_json(OLD) ->> 'tenant_id')::UUID;
    v_old_data  := to_jsonb(OLD);
    v_new_data  := NULL;
    v_action    := 'DELETE';
  ELSIF TG_OP = 'INSERT' THEN
    v_tenant_id := (row_to_json(NEW) ->> 'tenant_id')::UUID;
    v_old_data  := NULL;
    v_new_data  := to_jsonb(NEW);
    v_action    := 'INSERT';
  ELSE -- UPDATE
    v_tenant_id := (row_to_json(NEW) ->> 'tenant_id')::UUID;
    -- Solo registrar si hubo cambio real
    IF to_jsonb(OLD) = to_jsonb(NEW) THEN
      RETURN NEW;
    END IF;
    v_old_data  := to_jsonb(OLD);
    v_new_data  := to_jsonb(NEW);
    v_action    := 'UPDATE';
  END IF;

  INSERT INTO public.audit_log (
    tenant_id,
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    performed_by,
    entity,
    entity_id
  ) VALUES (
    v_tenant_id,
    v_user_id,
    v_action,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN (row_to_json(OLD) ->> 'id')::UUID
         ELSE (row_to_json(NEW) ->> 'id')::UUID END,
    v_old_data,
    v_new_data,
    v_user_id,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN (row_to_json(OLD) ->> 'id')::UUID
         ELSE (row_to_json(NEW) ->> 'id')::UUID END
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Crear triggers en tablas críticas ───────────────────────────
-- Nota: DROP IF EXISTS + CREATE para idempotencia

-- profiles (datos de usuarios y RUTs de trabajadores)
DROP TRIGGER IF EXISTS audit_profiles ON profiles;
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- non_conformities (incidentes sanitarios)
DROP TRIGGER IF EXISTS audit_nc ON non_conformities;
CREATE TRIGGER audit_nc
  AFTER INSERT OR UPDATE OR DELETE ON non_conformities
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- corrective_actions (acciones correctivas)
DROP TRIGGER IF EXISTS audit_ca ON corrective_actions;
CREATE TRIGGER audit_ca
  AFTER INSERT OR UPDATE OR DELETE ON corrective_actions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- temperature_logs (trazabilidad alimentaria DS 977/96)
DROP TRIGGER IF EXISTS audit_temp ON temperature_logs;
CREATE TRIGGER audit_temp
  AFTER INSERT OR UPDATE OR DELETE ON temperature_logs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- personnel_documents (carnets sanitarios — máxima sensibilidad)
DROP TRIGGER IF EXISTS audit_docs ON personnel_documents;
CREATE TRIGGER audit_docs
  AFTER INSERT OR UPDATE OR DELETE ON personnel_documents
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- planilla_months (apertura y firma de planillas)
DROP TRIGGER IF EXISTS audit_planilla_months ON planilla_months;
CREATE TRIGGER audit_planilla_months
  AFTER INSERT OR UPDATE OR DELETE ON planilla_months
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- ─── Vista de auditoría para administradores ─────────────────────
CREATE OR REPLACE VIEW v_audit_log AS
SELECT
  al.id,
  al.created_at,
  al.tenant_id,
  al.action,
  al.table_name,
  al.record_id,
  p.full_name    AS performed_by_name,
  p.role         AS performed_by_role,
  al.old_data,
  al.new_data
FROM audit_log al
LEFT JOIN profiles p ON p.id = al.performed_by
ORDER BY al.created_at DESC;

-- Solo admins del mismo tenant pueden ver la vista
GRANT SELECT ON v_audit_log TO authenticated;

-- Política ya existe en schema.sql para audit_log SELECT
-- Solo agregar política INSERT para trigger (SECURITY DEFINER ya la tiene)
