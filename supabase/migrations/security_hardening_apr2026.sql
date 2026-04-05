-- ══════════════════════════════════════════════════════════════════
-- SECURITY HARDENING - April 2026
-- Based on RestoBPM_Informe_Seguridad_Abril2026
-- ══════════════════════════════════════════════════════════════════

-- ─── FIX #1: Sanitize handle_new_user() trigger (CRITICAL) ──────
-- VULNERABILITY: Attacker could register with arbitrary tenant_id
-- and admin role via raw_user_meta_data, gaining access to any
-- tenant's data including RUTs and health documents.
-- FIX: Trigger no longer creates profiles from raw_user_meta_data.
-- All user creation goes through the secure create_tenant_user RPC.
-- ─────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.audit_log (tenant_id, action, entity, entity_id, performed_by, details)
    VALUES (
      NULL,
      'user_registered',
      'auth.users',
      NEW.id,
      NEW.id,
      json_build_object('email', NEW.email, 'method', 'trigger')::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ─── FIX #2: RLS DELETE policies (CRITICAL) ─────────────────────
-- VULNERABILITY: No explicit DELETE policies. While RLS defaults
-- to deny, this provides defense-in-depth against accidental
-- RLS disable and ensures explicit access control.
-- ─────────────────────────────────────────────────────────────────

-- Helper functions (in public schema since auth schema is restricted)
CREATE OR REPLACE FUNCTION public.get_my_tenant_id() RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_role() RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Immutable tables (never deletable)
CREATE POLICY "tenant_delete_deny"          ON tenants              FOR DELETE USING (false);
CREATE POLICY "audit_delete_deny"           ON audit_log            FOR DELETE USING (false);
CREATE POLICY "bpm_modules_delete_deny"     ON bpm_modules          FOR DELETE USING (false);
CREATE POLICY "bpm_items_delete_deny"       ON bpm_items            FOR DELETE USING (false);
CREATE POLICY "planilla_templates_delete_deny" ON planilla_templates FOR DELETE USING (false);

-- Admin-only delete
CREATE POLICY "profiles_delete_admin"       ON profiles             FOR DELETE USING (tenant_id = public.get_my_tenant_id() AND public.get_my_role() = 'admin');
CREATE POLICY "exec_delete_admin"           ON checklist_executions FOR DELETE USING (tenant_id = public.get_my_tenant_id() AND public.get_my_role() = 'admin');
CREATE POLICY "resp_delete_admin"           ON checklist_responses  FOR DELETE USING (EXISTS (SELECT 1 FROM checklist_executions e WHERE e.id = execution_id AND e.tenant_id = public.get_my_tenant_id()) AND public.get_my_role() = 'admin');
CREATE POLICY "nc_delete_admin"             ON non_conformities     FOR DELETE USING (tenant_id = public.get_my_tenant_id() AND public.get_my_role() = 'admin');
CREATE POLICY "pers_doc_delete_admin"       ON personnel_documents  FOR DELETE USING (tenant_id = public.get_my_tenant_id() AND public.get_my_role() = 'admin');
CREATE POLICY "temp_log_delete_admin"       ON temperature_logs     FOR DELETE USING (tenant_id = public.get_my_tenant_id() AND public.get_my_role() = 'admin');
CREATE POLICY "planilla_months_delete_admin" ON planilla_months     FOR DELETE USING (tenant_id = public.get_my_tenant_id() AND public.get_my_role() = 'admin');

-- Supervisor+ delete
CREATE POLICY "ca_delete_supervisor"        ON corrective_actions   FOR DELETE USING (EXISTS (SELECT 1 FROM non_conformities nc WHERE nc.id = non_conformity_id AND nc.tenant_id = public.get_my_tenant_id()) AND public.get_my_role() IN ('supervisor','admin'));
CREATE POLICY "planilla_entries_delete_supervisor" ON planilla_entries FOR DELETE USING (EXISTS (SELECT 1 FROM planilla_months m WHERE m.id = month_id AND m.tenant_id = public.get_my_tenant_id()) AND public.get_my_role() IN ('supervisor','admin'));
CREATE POLICY "planilla_items_delete_admin"  ON planilla_items      FOR DELETE USING (EXISTS (SELECT 1 FROM planilla_templates t WHERE t.id = template_id AND (t.tenant_id = public.get_my_tenant_id() OR t.tenant_id IS NULL)) AND public.get_my_role() = 'admin');

-- Tenant-level delete
CREATE POLICY "planilla_alerts_delete_tenant" ON planilla_alerts    FOR DELETE USING (tenant_id = public.get_my_tenant_id());


-- ─── FIX #3: Cryptographic password generation (HIGH) ───────────
-- VULNERABILITY: random() is not cryptographically secure.
-- FIX: Use gen_random_bytes() from pgcrypto for CSPRNG.
-- Also increased password length from 8 to 12 characters with
-- special characters for stronger temporary passwords.
-- (Function body in create_tenant_user_fn.sql)
-- ─────────────────────────────────────────────────────────────────

-- Storage: No buckets exist yet (verified April 2026).
-- When buckets are created, they MUST be private with RLS enabled.
-- NEVER create public buckets for documents containing PII.
