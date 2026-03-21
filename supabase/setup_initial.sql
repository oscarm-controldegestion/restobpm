-- ══════════════════════════════════════════════════════════════════
-- RESTOBPM - CONFIGURACIÓN INICIAL
-- Ejecutar DESPUÉS del schema.sql
-- Crea el primer tenant y el primer usuario administrador
-- ══════════════════════════════════════════════════════════════════

-- ─── PASO 1: Crear el tenant (tu establecimiento) ─────────────────
-- Modifica los valores con tus datos reales
INSERT INTO tenants (name, rut, address, phone, type, company_size, plan)
VALUES (
  'RestoBPM Demo',          -- Nombre del establecimiento
  '12.345.678-9',           -- RUT del establecimiento
  'Santiago, Chile',        -- Dirección
  '+56 9 1234 5678',        -- Teléfono
  'restaurant',             -- Tipo: restaurant | industry | casino | bakery | other
  'small',                  -- Tamaño: micro | small | medium | large | collective
  'pro'                     -- Plan inicial de prueba
)
RETURNING id, name;

-- ─── PASO 2: Registrar el usuario administrador ───────────────────
-- IMPORTANTE: Primero crea el usuario en:
--   Supabase → Authentication → Users → Add User
--   Con el correo y contraseña que quieras
--
-- Luego ejecuta esto con el UUID que te entregó Supabase:

/*
INSERT INTO profiles (id, tenant_id, full_name, rut, role)
VALUES (
  'UUID-DEL-USUARIO-AQUI',          -- Pegar UUID de Authentication → Users
  (SELECT id FROM tenants WHERE name = 'RestoBPM Demo'),
  'Oscar Munizaga',                 -- Tu nombre completo
  '12.345.678-9',                   -- Tu RUT
  'admin'
);
*/

-- ─── PASO 3: Verificar datos maestros BPM ────────────────────────
-- Confirmar que los módulos e ítems fueron cargados correctamente
SELECT code, name, order_index FROM bpm_modules ORDER BY order_index;
SELECT COUNT(*) as total_items FROM bpm_items;
SELECT m.code, COUNT(i.id) as items
FROM bpm_modules m
LEFT JOIN bpm_items i ON i.module_id = m.id
GROUP BY m.code ORDER BY m.code;

-- ─── PASO 4: Configurar localizaciones de temperatura (ejemplos) ──
-- Esto es de referencia para que los operadores sepan qué medir
-- Se puede gestionar desde la app en Configuración

-- ══════════════════════════════════════════════════════════════════
-- CONSULTAS ÚTILES DE ADMINISTRACIÓN
-- ══════════════════════════════════════════════════════════════════

-- Ver todos los tenants activos
-- SELECT id, name, plan, company_size, created_at FROM tenants WHERE active = true;

-- Ver usuarios de un tenant
-- SELECT p.full_name, p.role, p.active FROM profiles p
-- WHERE p.tenant_id = 'TU-TENANT-ID';

-- Ver historial de checklists de los últimos 7 días
-- SELECT e.folio, m.code, p.full_name, e.compliance_score, e.completed_at
-- FROM checklist_executions e
-- JOIN bpm_modules m ON m.id = e.module_id
-- JOIN profiles p ON p.id = e.executed_by
-- WHERE e.tenant_id = 'TU-TENANT-ID'
--   AND e.started_at > now() - interval '7 days'
-- ORDER BY e.completed_at DESC;

-- Ver no conformidades abiertas
-- SELECT nc.severity, bi.code, bi.name, p.full_name, nc.created_at
-- FROM non_conformities nc
-- JOIN bpm_items bi ON bi.id = nc.item_id
-- JOIN profiles p ON p.id = nc.detected_by
-- WHERE nc.tenant_id = 'TU-TENANT-ID' AND nc.status = 'open'
-- ORDER BY nc.severity DESC, nc.created_at DESC;
