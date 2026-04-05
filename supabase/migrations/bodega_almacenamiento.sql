-- ============================================================
-- Planilla: Control de Bodega y Almacenamiento
-- Basado en Checklist BPM D.S. 977/96 — Arts. 14, 28, 37, 61, 62, 69, 96
-- 20 ítems de verificación diaria
-- ============================================================

-- Template global (tenant_id = NULL → visible para todos los tenants)
INSERT INTO planilla_templates (id, name, description, order_index, active, layout_type)
VALUES (
  '00000001-0000-0000-0000-000000000009',
  'Control de Bodega y Almacenamiento',
  'Verificación de condiciones de almacenamiento, temperaturas, rotación de stock y BPM en bodega. D.S. 977/96 Arts. 14, 28, 37, 61, 62, 69, 96.',
  13,
  true,
  'default'
)
ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  order_index = EXCLUDED.order_index,
  layout_type = EXCLUDED.layout_type;

-- ── Items ──────────────────────────────────────────────────────────────────────
-- Sección: Condiciones generales de almacenamiento
INSERT INTO planilla_items (template_id, name, frequency, order_index, active, value_type, requires_document) VALUES
  ('00000001-0000-0000-0000-000000000009', 'Bodega limpia, ordenada y sin presencia de plagas o roedores', 'daily', 1, true, 'compliance', false),
  ('00000001-0000-0000-0000-000000000009', 'Productos almacenados sobre pallets o estantes (no directo al suelo)', 'daily', 2, true, 'compliance', false),
  ('00000001-0000-0000-0000-000000000009', 'Separación adecuada entre productos (mínimo 15 cm de la pared)', 'daily', 3, true, 'compliance', false),
  ('00000001-0000-0000-0000-000000000009', 'Ventilación suficiente y sin humedad excesiva en bodega seca', 'daily', 4, true, 'compliance', false),

-- Sección: Materias primas y rotación
  ('00000001-0000-0000-0000-000000000009', 'Materias primas provenientes de instalaciones autorizadas y correctamente rotuladas (Art. 61, 96)', 'daily', 5, true, 'compliance', false),
  ('00000001-0000-0000-0000-000000000009', 'Sistema FIFO/PEPS aplicado correctamente (primero en entrar, primero en salir)', 'daily', 6, true, 'compliance', false),
  ('00000001-0000-0000-0000-000000000009', 'Todos los productos con fecha de vencimiento vigente y etiquetado correcto', 'daily', 7, true, 'compliance', false),
  ('00000001-0000-0000-0000-000000000009', 'Especificaciones escritas disponibles para materias primas críticas (Art. 61)', 'daily', 8, true, 'compliance', true),

-- Sección: Control de temperaturas
  ('00000001-0000-0000-0000-000000000009', 'Temperatura de refrigeración: 0°C a 5°C (Art. 37)', 'daily', 9, true, 'temperature', false),
  ('00000001-0000-0000-0000-000000000009', 'Temperatura de congelación: ≤ -18°C (Art. 37)', 'daily', 10, true, 'temperature', false),
  ('00000001-0000-0000-0000-000000000009', 'Registro de temperaturas de equipos frigoríficos al día (Art. 69)', 'daily', 11, true, 'compliance', true),
  ('00000001-0000-0000-0000-000000000009', 'Equipos de frío funcionando correctamente, sin acumulación de hielo', 'daily', 12, true, 'compliance', false),

-- Sección: Cámaras y refrigeración
  ('00000001-0000-0000-0000-000000000009', 'Productos crudos separados de cocidos y listos para consumir', 'daily', 13, true, 'compliance', false),
  ('00000001-0000-0000-0000-000000000009', 'Carnes, aves y pescados en contenedores cerrados e identificados', 'daily', 14, true, 'compliance', false),
  ('00000001-0000-0000-0000-000000000009', 'Productos terminados almacenados en condiciones adecuadas de temperatura y envase (Art. 14)', 'daily', 15, true, 'compliance', false),

-- Sección: Agua y hielo
  ('00000001-0000-0000-0000-000000000009', 'Hielo utilizado fabricado con agua potable o proveedor autorizado (Art. 28)', 'daily', 16, true, 'compliance', false),

-- Sección: Control de stock
  ('00000001-0000-0000-0000-000000000009', 'Registro de ingresos y egresos de bodega actualizado', 'daily', 17, true, 'compliance', false),
  ('00000001-0000-0000-0000-000000000009', 'Sin productos vencidos, deteriorados o en mal estado en bodega', 'daily', 18, true, 'compliance', false),
  ('00000001-0000-0000-0000-000000000009', 'Productos de limpieza almacenados separados de alimentos', 'daily', 19, true, 'compliance', false),
  ('00000001-0000-0000-0000-000000000009', 'Materias primas con características organolépticas adecuadas: color, olor, textura (Art. 61)', 'daily', 20, true, 'compliance', false)
ON CONFLICT DO NOTHING;
