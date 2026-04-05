-- ══════════════════════════════════════════════════════════════════
-- RESTOBPM - ESQUEMA DE BASE DE DATOS
-- Supabase / PostgreSQL
-- Multi-tenant · Row Level Security · D.S. 977/96 RSA Chile
-- ══════════════════════════════════════════════════════════════════

-- ─── EXTENSIONES ──────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TENANTS (ESTABLECIMIENTOS) ───────────────────────────────────
CREATE TABLE tenants (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  rut                TEXT,
  address            TEXT,
  phone              TEXT,
  type               TEXT NOT NULL DEFAULT 'restaurant'
                       CHECK (type IN ('restaurant','industry','casino','bakery','other')),
  logo_url           TEXT,
  -- Nivel normativo según tamaño (afecta qué módulos se exigen)
  company_size       TEXT NOT NULL DEFAULT 'small'
                       CHECK (company_size IN ('micro','small','medium','large','collective')),
  plan               TEXT NOT NULL DEFAULT 'free'
                       CHECK (plan IN ('free','basic','pro','enterprise')),
  plan_expires_at    TIMESTAMPTZ,
  stripe_customer_id TEXT,
  active             BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── PERFILES DE USUARIO ──────────────────────────────────────────
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  rut         TEXT,
  role        TEXT NOT NULL CHECK (role IN ('admin','supervisor','operator')),
  phone       TEXT,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── MÓDULOS BPM ──────────────────────────────────────────────────
CREATE TABLE bpm_modules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT NOT NULL UNIQUE,  -- IF, IS, PM, CS, PF
  name         TEXT NOT NULL,
  description  TEXT,
  order_index  INTEGER NOT NULL,
  active       BOOLEAN NOT NULL DEFAULT true
);

-- ─── ÍTEMS DE CHECKLIST (82 controles) ───────────────────────────
CREATE TABLE bpm_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id       UUID NOT NULL REFERENCES bpm_modules(id),
  code            TEXT NOT NULL UNIQUE,  -- IF-001, IS-001, ...
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  frequency       TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly','per_reception','annual')),
  rsa_reference   TEXT,
  applies_to      TEXT[] NOT NULL DEFAULT '{all}',
  evidence_type   TEXT NOT NULL DEFAULT 'visual_check',
  requires_value  BOOLEAN NOT NULL DEFAULT false,
  value_unit      TEXT,
  value_min       NUMERIC,
  value_max       NUMERIC,
  active          BOOLEAN NOT NULL DEFAULT true,
  order_index     INTEGER NOT NULL
);

-- ─── EJECUCIONES DE CHECKLIST ─────────────────────────────────────
CREATE TABLE checklist_executions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  module_id         UUID NOT NULL REFERENCES bpm_modules(id),
  executed_by       UUID NOT NULL REFERENCES profiles(id),
  supervised_by     UUID REFERENCES profiles(id),
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'in_progress'
                      CHECK (status IN ('in_progress','completed','approved','rejected')),
  compliance_score  NUMERIC CHECK (compliance_score BETWEEN 0 AND 100),
  folio             TEXT UNIQUE,          -- BPM-2026-0001
  pdf_url           TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── RESPUESTAS DE CHECKLIST ──────────────────────────────────────
CREATE TABLE checklist_responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id    UUID NOT NULL REFERENCES checklist_executions(id) ON DELETE CASCADE,
  item_id         UUID NOT NULL REFERENCES bpm_items(id),
  result          TEXT NOT NULL CHECK (result IN ('complies','partial','non_compliant','na')),
  numeric_value   NUMERIC,
  photo_url       TEXT,
  notes           TEXT,
  responded_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── NO CONFORMIDADES ─────────────────────────────────────────────
CREATE TABLE non_conformities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  execution_id    UUID REFERENCES checklist_executions(id),
  item_id         UUID NOT NULL REFERENCES bpm_items(id),
  detected_by     UUID NOT NULL REFERENCES profiles(id),
  severity        TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  description     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','in_progress','resolved','verified')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── ACCIONES CORRECTIVAS ─────────────────────────────────────────
CREATE TABLE corrective_actions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  non_conformity_id     UUID NOT NULL REFERENCES non_conformities(id),
  assigned_to           UUID NOT NULL REFERENCES profiles(id),
  assigned_by           UUID NOT NULL REFERENCES profiles(id),
  description           TEXT NOT NULL,
  due_date              DATE NOT NULL,
  completed_at          TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','in_progress','completed','verified')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── DOCUMENTOS DE PERSONAL (carnets, exámenes) ───────────────────
CREATE TABLE personnel_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES profiles(id),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  document_type   TEXT NOT NULL CHECK (document_type IN ('food_handler_card','lab_exam','training','other')),
  issued_date     DATE,
  expiry_date     DATE,
  document_url    TEXT,
  status          TEXT NOT NULL DEFAULT 'valid'
                    CHECK (status IN ('valid','expiring_soon','expired')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── REGISTRO DE TEMPERATURA (alta frecuencia) ────────────────────
CREATE TABLE temperature_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  recorded_by   UUID NOT NULL REFERENCES profiles(id),
  location      TEXT NOT NULL,
  temperature   NUMERIC NOT NULL,
  min_temp      NUMERIC NOT NULL,
  max_temp      NUMERIC NOT NULL,
  in_range      BOOLEAN GENERATED ALWAYS AS (temperature >= min_temp AND temperature <= max_temp) STORED,
  notes         TEXT,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── LOG DE AUDITORÍA ─────────────────────────────────────────────
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id),
  user_id     UUID REFERENCES profiles(id),
  action      TEXT NOT NULL,
  table_name  TEXT,
  record_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════
-- ÍNDICES
-- ══════════════════════════════════════════════════════════════════
CREATE INDEX idx_profiles_tenant          ON profiles(tenant_id);
CREATE INDEX idx_profiles_role            ON profiles(role);
CREATE INDEX idx_checklist_exec_tenant    ON checklist_executions(tenant_id);
CREATE INDEX idx_checklist_exec_module    ON checklist_executions(module_id);
CREATE INDEX idx_checklist_exec_user      ON checklist_executions(executed_by);
CREATE INDEX idx_checklist_exec_date      ON checklist_executions(started_at);
CREATE INDEX idx_checklist_resp_exec      ON checklist_responses(execution_id);
CREATE INDEX idx_non_conf_tenant          ON non_conformities(tenant_id);
CREATE INDEX idx_non_conf_status          ON non_conformities(status);
CREATE INDEX idx_temp_logs_tenant_date    ON temperature_logs(tenant_id, recorded_at);
CREATE INDEX idx_pers_docs_expiry         ON personnel_documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) - SEGURIDAD MULTI-TENANT
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE tenants              ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_responses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE non_conformities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_actions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel_documents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE temperature_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log            ENABLE ROW LEVEL SECURITY;

-- bpm_modules y bpm_items son datos maestros: lectura pública
ALTER TABLE bpm_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bpm_items   ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bpm_modules_read_all" ON bpm_modules FOR SELECT USING (true);
CREATE POLICY "bpm_items_read_all"   ON bpm_items   FOR SELECT USING (true);

-- Función helper: obtener tenant_id del usuario actual
CREATE OR REPLACE FUNCTION auth.tenant_id() RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Función helper: obtener rol del usuario actual
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ── TENANTS ──
CREATE POLICY "tenant_select" ON tenants FOR SELECT
  USING (id = auth.tenant_id());
CREATE POLICY "tenant_update_admin" ON tenants FOR UPDATE
  USING (id = auth.tenant_id() AND auth.user_role() = 'admin');

-- ── PROFILES ──
CREATE POLICY "profiles_select_same_tenant" ON profiles FOR SELECT
  USING (tenant_id = auth.tenant_id());
CREATE POLICY "profiles_insert_admin" ON profiles FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id() AND auth.user_role() = 'admin');
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE
  USING (tenant_id = auth.tenant_id() AND auth.user_role() = 'admin');

-- ── CHECKLIST EXECUTIONS ──
CREATE POLICY "exec_select_tenant" ON checklist_executions FOR SELECT
  USING (tenant_id = auth.tenant_id());
CREATE POLICY "exec_insert_any" ON checklist_executions FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "exec_update_own_or_supervisor" ON checklist_executions FOR UPDATE
  USING (
    tenant_id = auth.tenant_id() AND (
      executed_by = auth.uid() OR
      auth.user_role() IN ('supervisor','admin')
    )
  );

-- ── CHECKLIST RESPONSES ──
CREATE POLICY "resp_select_tenant" ON checklist_responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM checklist_executions e
    WHERE e.id = execution_id AND e.tenant_id = auth.tenant_id()
  ));
CREATE POLICY "resp_insert_own" ON checklist_responses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM checklist_executions e
    WHERE e.id = execution_id AND e.tenant_id = auth.tenant_id()
  ));

-- ── NON CONFORMITIES ──
CREATE POLICY "nc_select_tenant" ON non_conformities FOR SELECT
  USING (tenant_id = auth.tenant_id());
CREATE POLICY "nc_insert_tenant" ON non_conformities FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());
CREATE POLICY "nc_update_supervisor" ON non_conformities FOR UPDATE
  USING (tenant_id = auth.tenant_id() AND auth.user_role() IN ('supervisor','admin'));

-- ── CORRECTIVE ACTIONS ──
CREATE POLICY "ca_select_tenant" ON corrective_actions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM non_conformities nc
    WHERE nc.id = non_conformity_id AND nc.tenant_id = auth.tenant_id()
  ));
CREATE POLICY "ca_insert_supervisor" ON corrective_actions FOR INSERT
  WITH CHECK (auth.user_role() IN ('supervisor','admin'));
CREATE POLICY "ca_update_tenant" ON corrective_actions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM non_conformities nc
    WHERE nc.id = non_conformity_id AND nc.tenant_id = auth.tenant_id()
  ));

-- ── PERSONAL DOCUMENTS ──
CREATE POLICY "pers_doc_select_tenant" ON personnel_documents FOR SELECT
  USING (tenant_id = auth.tenant_id());
CREATE POLICY "pers_doc_insert_supervisor" ON personnel_documents FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id() AND auth.user_role() IN ('supervisor','admin'));

-- ── TEMPERATURE LOGS ──
CREATE POLICY "temp_log_select_tenant" ON temperature_logs FOR SELECT
  USING (tenant_id = auth.tenant_id());
CREATE POLICY "temp_log_insert_tenant" ON temperature_logs FOR INSERT
  WITH CHECK (tenant_id = auth.tenant_id());

-- ── AUDIT LOG ──
CREATE POLICY "audit_select_admin" ON audit_log FOR SELECT
  USING (tenant_id = auth.tenant_id() AND auth.user_role() = 'admin');

-- ══════════════════════════════════════════════════════════════════
-- RLS DELETE POLICIES - Explicit delete restrictions per table
-- ══════════════════════════════════════════════════════════════════
CREATE POLICY "tenant_delete_deny"        ON tenants              FOR DELETE USING (false);
CREATE POLICY "profiles_delete_admin"     ON profiles             FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.user_role() = 'admin');
CREATE POLICY "exec_delete_admin"         ON checklist_executions FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.user_role() = 'admin');
CREATE POLICY "resp_delete_admin"         ON checklist_responses  FOR DELETE USING (EXISTS (SELECT 1 FROM checklist_executions e WHERE e.id = execution_id AND e.tenant_id = auth.tenant_id()) AND auth.user_role() = 'admin');
CREATE POLICY "nc_delete_admin"           ON non_conformities     FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.user_role() = 'admin');
CREATE POLICY "ca_delete_supervisor"      ON corrective_actions   FOR DELETE USING (EXISTS (SELECT 1 FROM non_conformities nc WHERE nc.id = non_conformity_id AND nc.tenant_id = auth.tenant_id()) AND auth.user_role() IN ('supervisor','admin'));
CREATE POLICY "pers_doc_delete_admin"     ON personnel_documents  FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.user_role() = 'admin');
CREATE POLICY "temp_log_delete_admin"     ON temperature_logs     FOR DELETE USING (tenant_id = auth.tenant_id() AND auth.user_role() = 'admin');
CREATE POLICY "audit_delete_deny"         ON audit_log            FOR DELETE USING (false);
CREATE POLICY "bpm_modules_delete_deny"   ON bpm_modules          FOR DELETE USING (false);
CREATE POLICY "bpm_items_delete_deny"     ON bpm_items            FOR DELETE USING (false);

-- ══════════════════════════════════════════════════════════════════
-- TRIGGER: auto-update updated_at
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at  BEFORE UPDATE ON tenants  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════════════
-- TRIGGER: crear perfil automáticamente al registrar usuario
-- ══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- SECURITY: Do NOT trust raw_user_meta_data for tenant_id or role.
  -- The create_tenant_user RPC handles profile creation securely.
  -- This trigger now only logs the event for audit purposes.
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
    -- Don't block user creation if audit log fails
    NULL;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ══════════════════════════════════════════════════════════════════
-- DATOS MAESTROS: MÓDULOS BPM
-- ══════════════════════════════════════════════════════════════════
INSERT INTO bpm_modules (code, name, description, order_index) VALUES
('IF', 'Instalaciones Físicas',       'Condiciones físicas y estructurales del establecimiento', 1),
('IS', 'Instalaciones Sanitarias',    'Suministro de agua, desagüe, lavamanos y servicios higiénicos', 2),
('PM', 'Personal Manipulador',        'Higiene personal, estado de salud y capacitación del personal', 3),
('CS', 'Condiciones de Saneamiento',  'Limpieza y desinfección, manejo de residuos y control de plagas', 4),
('PF', 'Proceso y Fabricación',       'Control de materias primas, temperaturas y proceso de elaboración', 5);

-- ══════════════════════════════════════════════════════════════════
-- DATOS MAESTROS: ÍTEMS BPM (82 controles)
-- ══════════════════════════════════════════════════════════════════

-- ── M1: Instalaciones Físicas ──
INSERT INTO bpm_items (module_id, code, name, description, frequency, rsa_reference, applies_to, evidence_type, order_index) VALUES
((SELECT id FROM bpm_modules WHERE code='IF'), 'IF-001', 'Alrededores limpios',
 'Entorno libre de basura, malezas, agua estancada y focos de contaminación externos',
 'weekly','Art. 47','{all}','visual_check',1),
((SELECT id FROM bpm_modules WHERE code='IF'), 'IF-002', 'Vías de acceso',
 'Pavimentadas o en condiciones que eviten generación de polvo y suciedad',
 'weekly','Art. 47','{all}','visual_check',2),
((SELECT id FROM bpm_modules WHERE code='IF'), 'IF-003', 'Estado de pisos',
 'Material resistente, liso, sin grietas, impermeable, fácil limpieza y con desagüe operativo',
 'daily','Art. 48','{all}','digital_record',3),
((SELECT id FROM bpm_modules WHERE code='IF'), 'IF-004', 'Estado de paredes',
 'Material impermeable, lavable, color claro, sin grietas ni desprendimientos',
 'weekly','Art. 48','{all}','digital_record',4),
((SELECT id FROM bpm_modules WHERE code='IF'), 'IF-005', 'Estado de cielos/techos',
 'Lisos, lavables, sin grietas ni humedad, sin condensación ni filtraciones',
 'weekly','Art. 48','{all}','digital_record',5),
((SELECT id FROM bpm_modules WHERE code='IF'), 'IF-006', 'Uniones sanitarias',
 'Uniones pared-piso con perfil redondeado (tipo sanitario)',
 'monthly','Art. 48','{industry,casino}','digital_record',6),
((SELECT id FROM bpm_modules WHERE code='IF'), 'IF-007', 'Puertas y ventanas',
 'Material liso, impermeable. Ventanas con mallas anti-insectos en buen estado',
 'weekly','Art. 48','{all}','visual_check',7),
((SELECT id FROM bpm_modules WHERE code='IF'), 'IF-008', 'Separación de áreas',
 'Separación física entre zona sucia (recepción/basura) y zona limpia (proceso/servicio)',
 'daily','Art. 49','{all}','digital_record',8),
((SELECT id FROM bpm_modules WHERE code='IF'), 'IF-009', 'Iluminación adecuada',
 'Nivel adecuado en áreas de proceso (mín. 540 lux en superficies de trabajo)',
 'monthly','Art. 51','{all}','visual_check',9),
((SELECT id FROM bpm_modules WHERE code='IF'), 'IF-010', 'Luminarias protegidas',
 'Cubiertas anti-rotura sobre áreas donde se manipulan alimentos descubiertos',
 'monthly','Art. 51','{all}','digital_record',10),
((SELECT id FROM bpm_modules WHERE code='IF'), 'IF-011', 'Ventilación suficiente',
 'Ventilación natural o mecánica para evitar calor excesivo y condensación',
 'weekly','Art. 52','{all}','visual_check',11),
((SELECT id FROM bpm_modules WHERE code='IF'), 'IF-012', 'Campana extractora',
 'Campana sobre equipos de cocción en buen estado, limpia y sin acumulación de grasa',
 'daily','Art. 52','{restaurant,casino}','digital_record',12),
((SELECT id FROM bpm_modules WHERE code='IF'), 'IF-013', 'Filtros de ventilación',
 'Filtros limpios, sin acumulación de grasa, polvo ni moho',
 'monthly','Art. 52','{all}','digital_record',13);

-- ── M2: Instalaciones Sanitarias ──
INSERT INTO bpm_items (module_id, code, name, description, frequency, rsa_reference, applies_to, evidence_type, requires_value, value_unit, value_min, value_max, order_index) VALUES
((SELECT id FROM bpm_modules WHERE code='IS'), 'IS-001', 'Agua potable disponible',
 'Disponible en cantidad suficiente y presión adecuada para las operaciones',
 'daily','Art. 53','{all}','visual_check', false, null, null, null, 1),
((SELECT id FROM bpm_modules WHERE code='IS'), 'IS-002', 'Estanque de agua',
 'Sistema de almacenamiento limpio, tapado e identificado, sin sedimentos ni algas',
 'weekly','Art. 53','{all}','visual_check', false, null, null, null, 2),
((SELECT id FROM bpm_modules WHERE code='IS'), 'IS-003', 'Control cloro residual',
 'Registro de cloro residual libre. Rango permitido: 0.2–2.0 mg/L',
 'daily','Art. 53','{all}','digital_record', true, 'mg/L', 0.2, 2.0, 3),
((SELECT id FROM bpm_modules WHERE code='IS'), 'IS-004', 'Análisis laboratorio agua',
 'Análisis microbiológico y físicoquímico por laboratorio acreditado',
 'annual','Art. 53','{all}','certificate', false, null, null, null, 4),
((SELECT id FROM bpm_modules WHERE code='IS'), 'IS-005', 'Sistema de desagüe',
 'Conectado a red pública, sin olores ni reflujos, sifones operativos',
 'weekly','Art. 54','{all}','visual_check', false, null, null, null, 5),
((SELECT id FROM bpm_modules WHERE code='IS'), 'IS-006', 'Canaletas y sumideros',
 'Limpios, sin obstrucciones, tapas o rejillas en buen estado',
 'daily','Art. 54','{all}','digital_record', false, null, null, null, 6),
((SELECT id FROM bpm_modules WHERE code='IS'), 'IS-007', 'Lavamanos en área proceso',
 'Disponibles en o junto al acceso del área de proceso',
 'daily','Art. 56','{all}','visual_check', false, null, null, null, 7),
((SELECT id FROM bpm_modules WHERE code='IS'), 'IS-008', 'Agua en lavamanos',
 'Agua potable fría y caliente disponible en lavamanos del área de proceso',
 'daily','Art. 56','{all}','visual_check', false, null, null, null, 8),
((SELECT id FROM bpm_modules WHERE code='IS'), 'IS-009', 'Jabón antibacterial',
 'Jabón líquido antibacterial disponible permanentemente en dispensador',
 'daily','Art. 56','{all}','visual_check', false, null, null, null, 9),
((SELECT id FROM bpm_modules WHERE code='IS'), 'IS-010', 'Secado con papel toalla',
 'Toallas de papel desechable como único sistema de secado. Dispensador con papel',
 'daily','Art. 56','{all}','visual_check', false, null, null, null, 10),
((SELECT id FROM bpm_modules WHERE code='IS'), 'IS-011', 'Letrero lavado de manos',
 'Instrucción visible de lavado correcto de manos en área de proceso y baños',
 'monthly','Art. 56','{all}','visual_check', false, null, null, null, 11),
((SELECT id FROM bpm_modules WHERE code='IS'), 'IS-012', 'Baños del personal',
 'Separados por sexo, limpios, con jabón, papel higiénico y papel toalla',
 'daily','Art. 57','{all}','digital_record', false, null, null, null, 12),
((SELECT id FROM bpm_modules WHERE code='IS'), 'IS-013', 'Baños sin acceso directo',
 'No comunican directamente con área de proceso. Con antecámara o pasillo',
 'monthly','Art. 57','{all}','visual_check', false, null, null, null, 13),
((SELECT id FROM bpm_modules WHERE code='IS'), 'IS-014', 'Vestuarios',
 'Casilleros individuales ventilados. Separación ropa de calle y ropa de trabajo',
 'weekly','Art. 58','{all}','visual_check', false, null, null, null, 14);

-- ── M3: Personal Manipulador ──
INSERT INTO bpm_items (module_id, code, name, description, frequency, rsa_reference, applies_to, evidence_type, order_index) VALUES
((SELECT id FROM bpm_modules WHERE code='PM'), 'PM-001', 'Uniforme completo y limpio',
 'Delantal/cotona limpia de color claro, gorro o cofia que cubre todo el cabello',
 'daily','Art. 59','{all}','visual_check',1),
((SELECT id FROM bpm_modules WHERE code='PM'), 'PM-002', 'Calzado exclusivo',
 'Calzado cerrado exclusivo para el área de trabajo. Limpio y en buen estado',
 'daily','Art. 59','{all}','visual_check',2),
((SELECT id FROM bpm_modules WHERE code='PM'), 'PM-003', 'Manos y uñas',
 'Manos limpias, uñas cortas, sin esmalte. Heridas cubiertas con venda visible + guante',
 'daily','Art. 59','{all}','visual_check',3),
((SELECT id FROM bpm_modules WHERE code='PM'), 'PM-004', 'Sin joyas ni accesorios',
 'Sin anillos, pulseras, collares, aros ni relojes durante la manipulación',
 'daily','Art. 59','{all}','visual_check',4),
((SELECT id FROM bpm_modules WHERE code='PM'), 'PM-005', 'Sin maquillaje excesivo',
 'Sin maquillaje excesivo, pestañas postizas ni uñas postizas',
 'daily','Art. 59','{all}','visual_check',5),
((SELECT id FROM bpm_modules WHERE code='PM'), 'PM-006', 'Lavado correcto de manos',
 'Personal lava manos al ingresar, después del baño, al cambiar tipo de alimento y tras basura',
 'daily','Art. 60','{all}','direct_supervision',6),
((SELECT id FROM bpm_modules WHERE code='PM'), 'PM-007', 'Sin comer/beber/fumar en proceso',
 'Personal no come, bebe, fuma ni usa teléfono personal en el área de proceso',
 'daily','Art. 60','{all}','direct_supervision',7),
((SELECT id FROM bpm_modules WHERE code='PM'), 'PM-008', 'Protección al toser/estornudar',
 'Personal con cuadro respiratorio usa mascarilla. No tose ni estornuda sobre alimentos',
 'daily','Art. 60','{all}','direct_supervision',8),
((SELECT id FROM bpm_modules WHERE code='PM'), 'PM-009', 'Carnet manipulador vigente',
 'Todo el personal con carnet de manipulador de alimentos vigente. Registro actualizado',
 'annual','Art. 61','{all}','document',9),
((SELECT id FROM bpm_modules WHERE code='PM'), 'PM-010', 'Exámenes de laboratorio vigentes',
 'Exámenes vigentes: coprocultivo, orina completa y parasitológico según SEREMI regional',
 'annual','Art. 61','{all}','document',10),
((SELECT id FROM bpm_modules WHERE code='PM'), 'PM-011', 'Control de enfermedades',
 'Personal con enf. gastrointestinal o infectocontagiosa apartado de manipulación directa',
 'daily','Art. 62','{all}','direct_supervision',11),
((SELECT id FROM bpm_modules WHERE code='PM'), 'PM-012', 'Programa capacitación BPM',
 'Programa anual con temas, fechas y registro de asistencia por sesión para todo el personal',
 'annual','Art. 63','{all}','document',12),
((SELECT id FROM bpm_modules WHERE code='PM'), 'PM-013', 'Capacitación inicial',
 'Nuevos trabajadores reciben capacitación BPM antes de iniciar manipulación de alimentos',
 'per_reception','Art. 63','{all}','document',13),
((SELECT id FROM bpm_modules WHERE code='PM'), 'PM-014', 'Capacitación en alérgenos',
 'Personal capacitado en identificación y manejo de alérgenos',
 'annual','Art. 63','{all}','document',14);

-- ── M4: Condiciones de Saneamiento ──
INSERT INTO bpm_items (module_id, code, name, description, frequency, rsa_reference, applies_to, evidence_type, order_index) VALUES
((SELECT id FROM bpm_modules WHERE code='CS'), 'CS-001', 'Programa L&D escrito',
 'Programa de limpieza y desinfección con cronograma por área/equipo, productos y concentraciones',
 'monthly','Art. 65','{all}','document',1),
((SELECT id FROM bpm_modules WHERE code='CS'), 'CS-002', 'Productos de L&D autorizados',
 'Productos autorizados para uso en alimentos. Fichas técnicas disponibles',
 'monthly','Art. 65','{all}','document',2),
((SELECT id FROM bpm_modules WHERE code='CS'), 'CS-003', 'Almacenamiento productos L&D',
 'Productos de limpieza almacenados en lugar separado y diferenciado de los alimentos',
 'daily','Art. 65','{all}','visual_check',3),
((SELECT id FROM bpm_modules WHERE code='CS'), 'CS-004', 'Diluciones correctas de desinfectante',
 'Desinfectantes preparados a concentración indicada en ficha técnica',
 'daily','Art. 65','{all}','digital_record',4),
((SELECT id FROM bpm_modules WHERE code='CS'), 'CS-005', 'Registro de L&D al día',
 'Registro diario completado: área, fecha, hora, producto usado, responsable',
 'daily','Art. 65','{all}','digital_record',5),
((SELECT id FROM bpm_modules WHERE code='CS'), 'CS-006', 'Utensilios diferenciados por color',
 'Utensilios de limpieza por código de color por área (rojo, amarillo, verde)',
 'weekly','Art. 65','{all}','visual_check',6),
((SELECT id FROM bpm_modules WHERE code='CS'), 'CS-007', 'Superficies de contacto higiénicas',
 'Equipos, utensilios y superficies de contacto con alimentos visualmente limpios antes de usar',
 'daily','Art. 65','{all}','visual_check',7),
((SELECT id FROM bpm_modules WHERE code='CS'), 'CS-008', 'Contenedores de basura con tapa',
 'Contenedores con tapa en buen estado. Vaciados con frecuencia suficiente',
 'daily','Art. 66','{all}','visual_check',8),
((SELECT id FROM bpm_modules WHERE code='CS'), 'CS-009', 'Retiro de basura del proceso',
 'Basura retirada del área de proceso con frecuencia que evite acumulación y malos olores',
 'daily','Art. 66','{all}','visual_check',9),
((SELECT id FROM bpm_modules WHERE code='CS'), 'CS-010', 'Área de basura externa',
 'Contenedores externos con tapa. Área separada del proceso, limpia y techada',
 'weekly','Art. 66','{all}','visual_check',10),
((SELECT id FROM bpm_modules WHERE code='CS'), 'CS-011', 'Programa control de plagas escrito',
 'Programa escrito con identificación de sectores críticos y plan de acción',
 'monthly','Art. 67','{all}','document',11),
((SELECT id FROM bpm_modules WHERE code='CS'), 'CS-012', 'Contrato empresa certificada plagas',
 'Contrato vigente con empresa certificada de control de plagas',
 'annual','Art. 67','{all}','certificate',12),
((SELECT id FROM bpm_modules WHERE code='CS'), 'CS-013', 'Certificados de fumigación vigentes',
 'Registros o certificados de aplicación vigentes (desinsectación, desratización)',
 'monthly','Art. 67','{all}','certificate',13),
((SELECT id FROM bpm_modules WHERE code='CS'), 'CS-014', 'Sin evidencia de plagas',
 'Sin señales de insectos, roedores o aves en instalaciones',
 'daily','Art. 67','{all}','visual_check',14),
((SELECT id FROM bpm_modules WHERE code='CS'), 'CS-015', 'Protección física anti-plagas',
 'Mallas en ventanas, sifones en desagües, sellado de grietas y orificios',
 'monthly','Art. 67','{all}','visual_check',15),
((SELECT id FROM bpm_modules WHERE code='CS'), 'CS-016', 'Mapa de trampas y cebos',
 'Trampas y cebos identificados en plano del establecimiento. Revisados según programa',
 'monthly','Art. 67','{all}','document',16);

-- ── M5: Proceso y Fabricación ──
INSERT INTO bpm_items (module_id, code, name, description, frequency, rsa_reference, applies_to, evidence_type, requires_value, value_unit, value_min, value_max, order_index) VALUES
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-001', 'Registro recepción materias primas',
 'Registro de cada recepción: proveedor, producto, fecha, temperatura y N° de lote',
 'per_reception','Art. 68','{all}','digital_record', false, null, null, null, 1),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-002', 'Inspección en recepción',
 'Control visual y organoléptico de materias primas. Rechazo inmediato si no cumple',
 'per_reception','Art. 68','{all}','digital_record', false, null, null, null, 2),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-003', 'Temperatura recepción refrigerados',
 'Verificar temperatura en recepción de productos refrigerados. Máximo 5°C',
 'per_reception','Art. 68','{all}','digital_record', true, '°C', -2.0, 5.0, 3),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-004', 'Temperatura recepción congelados',
 'Verificar temperatura en recepción de productos congelados. Máximo -18°C',
 'per_reception','Art. 68','{all}','digital_record', true, '°C', -30.0, -18.0, 4),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-005', 'Proveedores autorizados',
 'Proveedores con autorización sanitaria vigente verificada periódicamente',
 'annual','Art. 68','{all}','document', false, null, null, null, 5),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-006', 'Sistema PEPS implementado',
 'Primero en Entrar, Primero en Salir implementado. Productos más antiguos usados primero',
 'daily','Art. 69','{all}','visual_check', false, null, null, null, 6),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-007', 'Almacenamiento sobre estantes',
 'Alimentos en estantes, nunca directamente en el suelo (mín. 15 cm de altura)',
 'daily','Art. 69','{all}','visual_check', false, null, null, null, 7),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-008', 'Separación crudo/cocido',
 'Alimentos crudos almacenados abajo. Alimentos cocidos/listos arriba',
 'daily','Art. 69','{all}','visual_check', false, null, null, null, 8),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-009', 'Identificación de productos',
 'Todos los productos con etiqueta: nombre, fecha elaboración/apertura y fecha vencimiento',
 'daily','Art. 70','{all}','visual_check', false, null, null, null, 9),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-010', 'Temperatura cámara refrigeración (AM)',
 'Control temperatura refrigeración mañana. Rango: 0°C a 5°C',
 'daily','Art. 71','{all}','digital_record', true, '°C', 0.0, 5.0, 10),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-011', 'Temperatura cámara refrigeración (PM)',
 'Control temperatura refrigeración tarde. Rango: 0°C a 5°C',
 'daily','Art. 71','{all}','digital_record', true, '°C', 0.0, 5.0, 11),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-012', 'Temperatura cámara congelación',
 'Control temperatura congelación. Máximo: -18°C. Control mínimo 2 veces al día',
 'daily','Art. 71','{all}','digital_record', true, '°C', -40.0, -18.0, 12),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-013', 'Temperatura de cocción',
 'Temperatura interna de cocción ≥74°C para carnes, aves y productos de alto riesgo',
 'daily','Art. 72','{restaurant,casino}','digital_record', true, '°C', 74.0, 100.0, 13),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-014', 'Enfriamiento rápido',
 'Enfriamiento: 60°C a 21°C en ≤2h; 21°C a 5°C en ≤4h adicionales',
 'daily','Art. 72','{restaurant,casino}','digital_record', false, null, null, null, 14),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-015', 'Temperatura recalentamiento',
 'Temperatura interna de recalentamiento ≥74°C. No recalentar más de una vez',
 'daily','Art. 72','{restaurant,casino}','digital_record', true, '°C', 74.0, 100.0, 15),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-016', 'Mantención en caliente/frío',
 'En caliente ≥60°C; en línea fría ≤5°C. Verificación y registro cada 2 horas',
 'daily','Art. 72','{restaurant,casino}','digital_record', false, null, null, null, 16),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-017', 'Zona de peligro controlada',
 'Tiempo en zona de peligro (5°C-60°C) inferior a 4 horas acumuladas',
 'daily','Art. 72','{all}','direct_supervision', false, null, null, null, 17),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-018', 'Termómetros calibrados',
 'Termómetros de proceso calibrados y en buen estado. Registro de calibración disponible',
 'weekly','Art. 72','{all}','certificate', false, null, null, null, 18),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-019', 'Descongelación segura',
 'En refrigerador, agua fría corriente o microondas (uso inmediato). NUNCA a T° ambiente',
 'daily','Art. 73','{all}','direct_supervision', false, null, null, null, 19),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-020', 'Tablas de colores por alimento',
 'Tablas de cortar por color: Rojo=carne, Amarillo=aves, Azul=pescado, Verde=vegetales, Blanco=pan',
 'daily','Art. 73','{all}','visual_check', false, null, null, null, 20),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-021', 'Lavado de frutas y verduras',
 'Lavadas con agua potable y desinfectadas con producto autorizado antes de usar',
 'daily','Art. 73','{all}','direct_supervision', false, null, null, null, 21),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-022', 'Identificación producto en proceso',
 'Productos en proceso identificados: nombre, fecha elaboración, vencimiento y operario',
 'daily','Art. 70','{all}','visual_check', false, null, null, null, 22),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-023', 'Trazabilidad de lotes',
 'Registro de lotes: fecha, ingredientes, cantidad elaborada y destino',
 'daily','Art. 70','{industry,casino}','digital_record', false, null, null, null, 23),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-024', 'Material de equipos y utensilios',
 'Material inocuo: acero inoxidable o plástico grado alimentario. Sin maderas',
 'monthly','Art. 74','{all}','visual_check', false, null, null, null, 24),
((SELECT id FROM bpm_modules WHERE code='PF'), 'PF-025', 'Mantención preventiva de equipos',
 'Programa de mantención preventiva con registros: fecha, tipo, responsable',
 'monthly','Art. 74','{all}','digital_record', false, null, null, null, 25);

-- ══════════════════════════════════════════════════════════════════
-- FIN DEL ESQUEMA
-- Ejecutar en: Supabase → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════════════
