-- ══════════════════════════════════════════════════════════════════
-- PLANILLA: RECEPCIÓN DE PRODUCTOS
-- Template ID: 00000001-0000-0000-0000-000000000008
-- Registro diario de productos recibidos con datos del proveedor,
-- temperaturas, fechas de vencimiento, estado y evidencia fotográfica.
-- Base legal: D.S. 977/96 Art. 6, 69 (cadena de frío y trazabilidad)
-- ══════════════════════════════════════════════════════════════════

-- ─── Nuevo layout_type ───────────────────────────────────────────
-- Ya existe layout_type en planilla_templates; solo actualizar enum
-- en documentación (no hay CHECK constraint en el schema).

-- ─── Template ────────────────────────────────────────────────────
INSERT INTO planilla_templates (id, name, description, order_index, layout_type)
VALUES (
  '00000001-0000-0000-0000-000000000008',
  'Recepción de Productos',
  'Registro de productos recibidos: proveedor, temperatura, fecha de vencimiento, '
  'lote, estado de conformidad y evidencia fotográfica. '
  'Conforme a D.S. 977/96 y trazabilidad de cadena de frío.',
  8,
  'product_reception'
)
ON CONFLICT (id) DO NOTHING;

-- ─── Tabla de registros de recepción ─────────────────────────────
CREATE TABLE IF NOT EXISTS product_reception_entries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  month_id            UUID NOT NULL REFERENCES planilla_months(id) ON DELETE CASCADE,

  -- Datos de recepción
  fecha_recepcion     TIMESTAMPTZ NOT NULL DEFAULT now(),
  proveedor           TEXT NOT NULL,
  producto            TEXT NOT NULL,
  marca               TEXT,
  cantidad            NUMERIC(10,2),
  unidad              TEXT DEFAULT 'kg',    -- kg, L, unidades, cajas, etc.

  -- Control de temperatura (cadena de frío)
  temperatura         NUMERIC(5,1),         -- temperatura medida al recibir
  temperatura_min     NUMERIC(5,1),         -- rango aceptable mínimo
  temperatura_max     NUMERIC(5,1),         -- rango aceptable máximo

  -- Trazabilidad
  fecha_vencimiento   DATE,
  lote                TEXT,

  -- Estado de conformidad
  estado              TEXT NOT NULL DEFAULT 'conforme'
                        CHECK (estado IN ('conforme', 'no_conforme', 'observacion')),
  observaciones       TEXT,

  -- Evidencia fotográfica
  photo_url           TEXT,                 -- URL en Supabase Storage
  photo_taken_at      TIMESTAMPTZ,

  -- Auditoría
  recibido_por        TEXT,                 -- nombre del operador
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Índices ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reception_month    ON product_reception_entries(month_id);
CREATE INDEX IF NOT EXISTS idx_reception_tenant   ON product_reception_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reception_fecha    ON product_reception_entries(fecha_recepcion DESC);
CREATE INDEX IF NOT EXISTS idx_reception_estado   ON product_reception_entries(estado);

-- ─── RLS ─────────────────────────────────────────────────────────
ALTER TABLE product_reception_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reception_select" ON product_reception_entries
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "reception_insert" ON product_reception_entries
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "reception_update" ON product_reception_entries
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "reception_delete" ON product_reception_entries
  FOR DELETE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'supervisor')
  );

-- ─── Supabase Storage: bucket product-reception ──────────────────
-- Ejecutar desde Dashboard → Storage → New Bucket:
--   Name: product-reception
--   Private: YES (no público)
--   File size limit: 5 MB
--   Allowed MIME types: image/jpeg, image/png, image/webp
--
-- Políticas del bucket (ejecutar en SQL Editor):
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-reception',
  'product-reception',
  false,
  5242880,  -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies para el bucket
CREATE POLICY "reception_photos_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'product-reception'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (
      SELECT tenant_id::text FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "reception_photos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-reception'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (
      SELECT tenant_id::text FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "reception_photos_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-reception'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (
      SELECT tenant_id::text FROM profiles WHERE id = auth.uid()
    )
  );
