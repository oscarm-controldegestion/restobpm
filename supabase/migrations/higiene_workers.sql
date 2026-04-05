-- ============================================================
-- Trabajadores y registros de higiene por trabajador
-- ============================================================

-- 1. Tabla de trabajadores por tenant
CREATE TABLE IF NOT EXISTS workers (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,
  rut         text NOT NULL,
  shift       text NOT NULL DEFAULT 'AM',   -- AM | PM | Ambos
  active      boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workers_tenant_isolation" ON workers
  USING  (tenant_id = public.get_my_tenant_id())
  WITH CHECK (tenant_id = public.get_my_tenant_id());

-- 2. Registros de higiene por trabajador (reemplaza planilla_entries para este layout)
CREATE TABLE IF NOT EXISTS planilla_hygiene_entries (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  month_id   uuid NOT NULL REFERENCES planilla_months(id) ON DELETE CASCADE,
  worker_id  uuid NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  item_id    uuid NOT NULL REFERENCES planilla_items(id) ON DELETE CASCADE,
  day        integer NOT NULL CHECK (day BETWEEN 1 AND 31),
  value      text CHECK (value IN ('S','N')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (month_id, worker_id, item_id, day)
);

ALTER TABLE planilla_hygiene_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hygiene_entries_tenant_isolation" ON planilla_hygiene_entries
  USING  (tenant_id = public.get_my_tenant_id())
  WITH CHECK (tenant_id = public.get_my_tenant_id());

-- 3. Agregar layout_type a planilla_templates
ALTER TABLE planilla_templates
  ADD COLUMN IF NOT EXISTS layout_type text NOT NULL DEFAULT 'default';

-- 4. Marcar el template de Higiene de Manipuladores con layout_type='worker_hygiene'
UPDATE planilla_templates
   SET layout_type = 'worker_hygiene'
 WHERE id = '00000001-0000-0000-0000-000000000006';
