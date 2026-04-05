-- ══════════════════════════════════════════════════════════════════
-- REVISIONES GENERALES PLANILLA - April 2026
-- New monthly compliance template for general inspections
-- Adds requires_document field and planilla_documents table
-- ══════════════════════════════════════════════════════════════════

-- ─── Add requires_document to planilla_items ────────────────────
ALTER TABLE planilla_items
  ADD COLUMN IF NOT EXISTS requires_document BOOLEAN NOT NULL DEFAULT false;

-- ─── New template: Revisiones Generales ─────────────────────────
INSERT INTO planilla_templates (id, tenant_id, name, description, active, order_index)
VALUES (
  '00000001-0000-0000-0000-000000000005',
  NULL,
  'Revisiones Generales',
  'Control mensual de documentación, resoluciones sanitarias y servicios contratados',
  true,
  5
) ON CONFLICT (id) DO NOTHING;

-- ─── Items for Revisiones Generales ─────────────────────────────
INSERT INTO planilla_items (id, template_id, name, frequency, value_type, equipment_number, order_index, active, requires_document) VALUES
  ('00000005-0001-0000-0000-000000000001', '00000001-0000-0000-0000-000000000005', 'Conexión a red de agua potable',                              'monthly', 'compliance', NULL, 1,  true, false),
  ('00000005-0002-0000-0000-000000000001', '00000001-0000-0000-0000-000000000005', 'Conexión a estanque de agua potable',                         'monthly', 'compliance', NULL, 2,  true, false),
  ('00000005-0003-0000-0000-000000000001', '00000001-0000-0000-0000-000000000005', 'Conexión a red de alcantarillado',                            'monthly', 'compliance', NULL, 3,  true, false),
  ('00000005-0004-0000-0000-000000000001', '00000001-0000-0000-0000-000000000005', 'Conexión a fosa séptica con resolución sanitaria',            'monthly', 'compliance', NULL, 4,  true, true),
  ('00000005-0005-0000-0000-000000000001', '00000001-0000-0000-0000-000000000005', 'Zona para dejar basura y basureros con tapa',                 'monthly', 'compliance', NULL, 5,  true, false),
  ('00000005-0006-0000-0000-000000000001', '00000001-0000-0000-0000-000000000005', 'Retiro de basura por camión municipal',                       'monthly', 'compliance', NULL, 6,  true, false),
  ('00000005-0007-0000-0000-000000000001', '00000001-0000-0000-0000-000000000005', 'Retiro de basura a vertedero',                                'monthly', 'compliance', NULL, 7,  true, false),
  ('00000005-0008-0000-0000-000000000001', '00000001-0000-0000-0000-000000000005', 'Recibo de entrega en vertedero y resolución sanitaria',       'monthly', 'compliance', NULL, 8,  true, true),
  ('00000005-0009-0000-0000-000000000001', '00000001-0000-0000-0000-000000000005', 'Contrato de arriendo o dominio de la propiedad',              'monthly', 'compliance', NULL, 9,  true, true),
  ('00000005-0010-0000-0000-000000000001', '00000001-0000-0000-0000-000000000005', 'Resolución sanitaria asociada al giro y la dirección',       'monthly', 'compliance', NULL, 10, true, true),
  ('00000005-0011-0000-0000-000000000001', '00000001-0000-0000-0000-000000000005', 'Resolución sanitaria asociada a razón social de la empresa', 'monthly', 'compliance', NULL, 11, true, true),
  ('00000005-0012-0000-0000-000000000001', '00000001-0000-0000-0000-000000000005', 'Manual BPM impreso y digital',                                'monthly', 'compliance', NULL, 12, true, true),
  ('00000005-0013-0000-0000-000000000001', '00000001-0000-0000-0000-000000000005', 'Proveedor de control de plagas con resolución sanitaria',     'monthly', 'compliance', NULL, 13, true, true),
  ('00000005-0014-0000-0000-000000000001', '00000001-0000-0000-0000-000000000005', 'Proveedor de hielo con resolución sanitaria',                 'monthly', 'compliance', NULL, 14, true, true)
ON CONFLICT (id) DO NOTHING;

-- ─── planilla_documents table ────────────────────────────────────
-- Stores references to uploaded files (PDF/photo) per item per month
CREATE TABLE IF NOT EXISTS planilla_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  month_id     UUID NOT NULL REFERENCES planilla_months(id) ON DELETE CASCADE,
  item_id      UUID NOT NULL REFERENCES planilla_items(id) ON DELETE CASCADE,
  file_url     TEXT NOT NULL,
  file_name    TEXT NOT NULL,
  file_type    TEXT NOT NULL CHECK (file_type IN ('pdf', 'image')),
  file_size    BIGINT,
  uploaded_by  UUID REFERENCES profiles(id),
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  note         TEXT,
  UNIQUE(month_id, item_id)
);

ALTER TABLE planilla_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pdocs_select" ON planilla_documents
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "pdocs_insert" ON planilla_documents
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "pdocs_update" ON planilla_documents
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "pdocs_delete" ON planilla_documents
  FOR DELETE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'supervisor')
  );

-- ─── Storage policies for planilla-docs bucket ──────────────────
-- File path format: {tenant_id}/{month_id}/{filename}
CREATE POLICY "planilla_docs_select"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'planilla-docs'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = public.get_my_tenant_id()::text
);

CREATE POLICY "planilla_docs_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'planilla-docs'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = public.get_my_tenant_id()::text
);

CREATE POLICY "planilla_docs_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'planilla-docs'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = public.get_my_tenant_id()::text
  AND public.get_my_role() IN ('admin', 'supervisor')
);
