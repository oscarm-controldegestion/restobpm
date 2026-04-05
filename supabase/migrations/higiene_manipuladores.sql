-- ══════════════════════════════════════════════════════════════════
-- HIGIENE DE MANIPULADORES DE ALIMENTOS — April 2026
-- Registro semanal/diario por trabajador
-- Referencia: REGISTRO DE HIGIENE MANIPULADORES DE ALIMENTOS.xlsx
-- ══════════════════════════════════════════════════════════════════

-- ─── Template ────────────────────────────────────────────────────
INSERT INTO planilla_templates (id, tenant_id, name, description, active, order_index)
VALUES (
  '00000001-0000-0000-0000-000000000006',
  NULL,
  'Higiene de Manipuladores',
  'Registro diario de higiene personal por manipulador: lavado de manos, uñas, uniforme y vestimenta',
  true,
  6
) ON CONFLICT (id) DO NOTHING;

-- ─── Items (diarios, cumplimiento sí/no) ─────────────────────────
INSERT INTO planilla_items
  (id, template_id, name, frequency, value_type, equipment_number, order_index, active, requires_document)
VALUES
  ('00000006-0001-0000-0000-000000000001',
   '00000001-0000-0000-0000-000000000006',
   'Realizó lavado de manos al inicio y durante el turno',
   'daily', 'compliance', NULL, 1, true, false),

  ('00000006-0002-0000-0000-000000000001',
   '00000001-0000-0000-0000-000000000006',
   'Uñas cortas y limpias',
   'daily', 'compliance', NULL, 2, true, false),

  ('00000006-0003-0000-0000-000000000001',
   '00000001-0000-0000-0000-000000000006',
   'Uniforme limpio',
   'daily', 'compliance', NULL, 3, true, false),

  ('00000006-0004-0000-0000-000000000001',
   '00000001-0000-0000-0000-000000000006',
   'Cumple con el protocolo de vestimenta',
   'daily', 'compliance', NULL, 4, true, false)

ON CONFLICT (id) DO NOTHING;
