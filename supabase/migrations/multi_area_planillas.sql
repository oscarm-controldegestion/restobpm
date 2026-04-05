-- ══════════════════════════════════════════════════════════════════
-- MULTI-AREA PLANILLAS - April 2026
-- Allows multiple planilla instances per template (one per area)
-- with specific item assignments per planilla
-- ══════════════════════════════════════════════════════════════════

-- ─── FIX: Add INSERT/UPDATE RLS policies for planilla_items ─────
-- BUG: Supervisor could not update item names because only SELECT
-- and DELETE policies existed. No INSERT or UPDATE policies.
-- ─────────────────────────────────────────────────────────────────

CREATE POLICY "items_insert_admin" ON planilla_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM planilla_templates t
      WHERE t.id = template_id
      AND (t.tenant_id = public.get_my_tenant_id() OR t.tenant_id IS NULL)
    )
    AND public.get_my_role() IN ('admin', 'supervisor')
  );

CREATE POLICY "items_update_admin" ON planilla_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM planilla_templates t
      WHERE t.id = template_id
      AND (t.tenant_id = public.get_my_tenant_id() OR t.tenant_id IS NULL)
    )
    AND public.get_my_role() IN ('admin', 'supervisor')
  );

-- ─── Drop unique constraint to allow multiple planilla_months ───
-- Previously: UNIQUE (tenant_id, template_id, year, month)
-- Now: Multiple instances per template per period (one per area)
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE planilla_months
  DROP CONSTRAINT planilla_months_tenant_id_template_id_year_month_key;

-- ─── Add label column for identifying each instance ─────────────
ALTER TABLE planilla_months
  ADD COLUMN IF NOT EXISTS label TEXT;

-- ─── Junction table: which items belong to each planilla_month ──
CREATE TABLE IF NOT EXISTS planilla_month_items (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_id  UUID NOT NULL REFERENCES planilla_months(id) ON DELETE CASCADE,
  item_id   UUID NOT NULL REFERENCES planilla_items(id) ON DELETE CASCADE,
  UNIQUE(month_id, item_id)
);

ALTER TABLE planilla_month_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pmi_select" ON planilla_month_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM planilla_months m
      WHERE m.id = month_id
      AND m.tenant_id = public.get_my_tenant_id()
    )
  );

CREATE POLICY "pmi_insert" ON planilla_month_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM planilla_months m
      WHERE m.id = month_id
      AND m.tenant_id = public.get_my_tenant_id()
    )
    AND public.get_my_role() IN ('admin', 'supervisor')
  );

CREATE POLICY "pmi_delete" ON planilla_month_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM planilla_months m
      WHERE m.id = month_id
      AND m.tenant_id = public.get_my_tenant_id()
    )
    AND public.get_my_role() IN ('admin', 'supervisor')
  );
