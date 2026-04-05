-- ══════════════════════════════════════════════════════════════════
-- PROGRAMAS DOCUMENTALES: Fumigación, Limpieza Diaria,
--                         Capacitación, Mantenimiento de Equipos
-- Base legal: D.S. 977/96 Arts. 6, 12, 14, 41, 52, 69
-- ══════════════════════════════════════════════════════════════════

-- ─── 1. PROGRAMA DE FUMIGACIÓN ────────────────────────────────────
-- Template: periodo configurable (mensual / bimestral / trimestral)
INSERT INTO planilla_templates (id, name, description, order_index, layout_type)
VALUES (
  '00000001-0000-0000-0000-000000000009',
  'Programa de Fumigación',
  'Registro de fumigaciones y control de plagas. Periodo configurable: '
  'mensual, bimestral o trimestral. Incluye empresa aplicadora, '
  'productos SAG, áreas tratadas y certificado adjunto. D.S. 977/96 Art. 14.',
  9,
  'fumigation_program'
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS fumigation_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  month_id            UUID NOT NULL REFERENCES planilla_months(id) ON DELETE CASCADE,

  fecha_fumigacion    DATE NOT NULL,
  empresa_fumigadora  TEXT NOT NULL,
  nombre_tecnico      TEXT,
  n_registro_sag      TEXT,              -- N° registro SAG del plaguicida
  producto_utilizado  TEXT,
  dosis               TEXT,              -- concentración / dosificación
  areas_tratadas      TEXT,              -- descripción textual de áreas
  plagas_objetivo     TEXT,              -- moscas, cucarachas, roedores, etc.
  periodo             TEXT NOT NULL DEFAULT 'mensual'
                        CHECK (periodo IN ('mensual', 'bimestral', 'trimestral')),
  fecha_proxima       DATE,
  certificado_url     TEXT,              -- PDF o imagen del certificado
  certificado_nombre  TEXT,
  observaciones       TEXT,

  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fumigation_month   ON fumigation_records(month_id);
CREATE INDEX IF NOT EXISTS idx_fumigation_tenant  ON fumigation_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fumigation_fecha   ON fumigation_records(fecha_fumigacion DESC);

ALTER TABLE fumigation_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fumigation_select" ON fumigation_records
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "fumigation_insert" ON fumigation_records
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "fumigation_update" ON fumigation_records
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "fumigation_delete" ON fumigation_records
  FOR DELETE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'supervisor')
  );

-- ─── 2. PROGRAMA DE LIMPIEZA DIARIA ──────────────────────────────
-- Usa layout 'default' + items de compliance diarios
-- El template incluye ítems pre-sembrados por área
INSERT INTO planilla_templates (id, name, description, order_index, layout_type)
VALUES (
  '00000001-0000-0000-0000-000000000010',
  'Programa de Limpieza Diaria',
  'Control diario de limpieza y desinfección por áreas. '
  'Marca C (Cumple) / NC (No Cumple) / NA (No Aplica) cada día. '
  'D.S. 977/96 Arts. 6, 12 y 41.',
  10,
  'default'
)
ON CONFLICT (id) DO NOTHING;

-- Ítems pre-sembrados del programa de limpieza (pueden editarse por supervisor)
INSERT INTO planilla_items (id, template_id, name, description, order_index, frequency, value_type, active)
VALUES
  ('00000010-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000010',
   'Superficies de trabajo (mesones y encimeras)',
   'Limpiar y desinfectar todas las superficies de contacto con alimentos', 1, 'daily', 'compliance', true),
  ('00000010-0000-0000-0000-000000000002', '00000001-0000-0000-0000-000000000010',
   'Pisos y drenajes de cocina',
   'Barrer, fregar y desinfectar pisos; limpiar canaletas y sifones', 2, 'daily', 'compliance', true),
  ('00000010-0000-0000-0000-000000000003', '00000001-0000-0000-0000-000000000010',
   'Equipos y utensilios de cocina',
   'Lavar, enjuagar y desinfectar ollas, sartenes, tablas, cuchillos', 3, 'daily', 'compliance', true),
  ('00000010-0000-0000-0000-000000000004', '00000001-0000-0000-0000-000000000010',
   'Refrigeradores y congeladores',
   'Limpiar estantes, eliminar derrames, verificar temperatura y sellos', 4, 'daily', 'compliance', true),
  ('00000010-0000-0000-0000-000000000005', '00000001-0000-0000-0000-000000000010',
   'Almacenamiento seco (despensa / bodega)',
   'Barrer, limpiar estantes, verificar orden y rotación FIFO', 5, 'daily', 'compliance', true),
  ('00000010-0000-0000-0000-000000000006', '00000001-0000-0000-0000-000000000010',
   'Baños y vestidores del personal',
   'Limpiar y desinfectar inodoros, lavamanos, pisos y espejos', 6, 'daily', 'compliance', true),
  ('00000010-0000-0000-0000-000000000007', '00000001-0000-0000-0000-000000000010',
   'Área de comedor / sala de atención',
   'Limpiar mesas, sillas, pisos y superficies de contacto con clientes', 7, 'daily', 'compliance', true),
  ('00000010-0000-0000-0000-000000000008', '00000001-0000-0000-0000-000000000010',
   'Control de basura y residuos',
   'Vaciar papeleros, retirar basura, limpiar contenedores y área de residuos', 8, 'daily', 'compliance', true),
  ('00000010-0000-0000-0000-000000000009', '00000001-0000-0000-0000-000000000010',
   'Campanas y extractores de cocina',
   'Limpiar filtros de grasa y superficies de campana extractora', 9, 'daily', 'compliance', true),
  ('00000010-0000-0000-0000-000000000010', '00000001-0000-0000-0000-000000000010',
   'Limpiapisos / trapeadores y utensilios de aseo',
   'Lavar y desinfectar implementos de limpieza; secar y almacenar correctamente', 10, 'daily', 'compliance', true)
ON CONFLICT (id) DO NOTHING;

-- ─── 3. PROGRAMA DE CAPACITACIÓN ─────────────────────────────────
INSERT INTO planilla_templates (id, name, description, order_index, layout_type)
VALUES (
  '00000001-0000-0000-0000-000000000011',
  'Programa de Capacitación',
  'Registro de capacitaciones del personal en higiene, BPM, manipulación '
  'de alimentos y HACCP. Incluye tema, instructor, participantes y evidencia. '
  'D.S. 977/96 Art. 52; Ley 20.380.',
  11,
  'training_program'
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS training_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  month_id            UUID NOT NULL REFERENCES planilla_months(id) ON DELETE CASCADE,

  fecha               DATE NOT NULL,
  tema                TEXT NOT NULL,
  objetivos           TEXT,
  tipo_instructor     TEXT NOT NULL DEFAULT 'interno'
                        CHECK (tipo_instructor IN ('interno', 'externo', 'online')),
  nombre_instructor   TEXT,
  empresa_instructor  TEXT,
  duracion_horas      NUMERIC(4,1),
  n_participantes     INTEGER,
  lista_participantes TEXT,              -- nombres separados por coma
  evaluacion          TEXT NOT NULL DEFAULT 'pendiente'
                        CHECK (evaluacion IN ('aprobado', 'reprobado', 'pendiente', 'sin_evaluacion')),
  puntaje_promedio    NUMERIC(5,2),
  certificado_url     TEXT,
  certificado_nombre  TEXT,
  material_url        TEXT,
  material_nombre     TEXT,
  observaciones       TEXT,

  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_month   ON training_records(month_id);
CREATE INDEX IF NOT EXISTS idx_training_tenant  ON training_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_training_fecha   ON training_records(fecha DESC);

ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_select" ON training_records
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "training_insert" ON training_records
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "training_update" ON training_records
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "training_delete" ON training_records
  FOR DELETE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'supervisor')
  );

-- ─── 4. PROGRAMA DE MANTENIMIENTO DE EQUIPOS ─────────────────────
INSERT INTO planilla_templates (id, name, description, order_index, layout_type)
VALUES (
  '00000001-0000-0000-0000-000000000012',
  'Programa de Mantenimiento de Equipos',
  'Registro de mantenimiento preventivo y correctivo de equipos de cocina. '
  'Controla próximos mantenimientos y estado de cada equipo. D.S. 977/96 Art. 6.',
  12,
  'equipment_maintenance'
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS equipment_maintenance_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  month_id            UUID NOT NULL REFERENCES planilla_months(id) ON DELETE CASCADE,

  fecha_mantenimiento DATE NOT NULL,
  equipo_nombre       TEXT NOT NULL,
  equipo_marca        TEXT,
  equipo_modelo       TEXT,
  equipo_n_serie      TEXT,
  tipo_mantenimiento  TEXT NOT NULL DEFAULT 'preventivo'
                        CHECK (tipo_mantenimiento IN ('preventivo', 'correctivo', 'calibracion', 'inspeccion')),
  descripcion_trabajo TEXT NOT NULL,
  empresa_tecnico     TEXT,
  nombre_tecnico      TEXT,
  repuestos_utilizados TEXT,
  costo               NUMERIC(12,2),
  estado_equipo       TEXT NOT NULL DEFAULT 'en_servicio'
                        CHECK (estado_equipo IN ('en_servicio', 'fuera_servicio', 'en_reparacion')),
  fecha_proxima       DATE,
  certificado_url     TEXT,
  certificado_nombre  TEXT,
  observaciones       TEXT,

  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maint_month   ON equipment_maintenance_records(month_id);
CREATE INDEX IF NOT EXISTS idx_maint_tenant  ON equipment_maintenance_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maint_fecha   ON equipment_maintenance_records(fecha_mantenimiento DESC);
CREATE INDEX IF NOT EXISTS idx_maint_equipo  ON equipment_maintenance_records(equipo_nombre);
CREATE INDEX IF NOT EXISTS idx_maint_estado  ON equipment_maintenance_records(estado_equipo);

ALTER TABLE equipment_maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maint_select" ON equipment_maintenance_records
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "maint_insert" ON equipment_maintenance_records
  FOR INSERT WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "maint_update" ON equipment_maintenance_records
  FOR UPDATE USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "maint_delete" ON equipment_maintenance_records
  FOR DELETE USING (
    tenant_id = public.get_my_tenant_id()
    AND public.get_my_role() IN ('admin', 'supervisor')
  );

-- ─── Storage bucket: program-documents (compartido entre programas) ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'program-documents',
  'program-documents',
  false,
  10485760,  -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "progdocs_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'program-documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (
      SELECT tenant_id::text FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "progdocs_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'program-documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (
      SELECT tenant_id::text FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "progdocs_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'program-documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (
      SELECT tenant_id::text FROM profiles WHERE id = auth.uid()
    )
  );
