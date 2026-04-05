-- ============================================================
-- Planilla: Revisión de Infraestructura
-- Template ID : 00000001-0000-0000-0000-000000000007
-- 16 ítems mensual/cumplimiento basados en Instalaciones BPM
-- (Checklist_BPM_Requisitos_Cumplimiento, filas 6-21)
-- ============================================================

-- Plantilla
INSERT INTO planilla_templates (id, name, description, order_index)
VALUES (
  '00000001-0000-0000-0000-000000000007',
  'Revisión de Infraestructura',
  'Revisión mensual de instalaciones conforme a requisitos BPM D.S. 977/96. '
  'Cubre pisos, paredes, cielos, ventanas, puertas, estructuras, superficies, '
  'evacuación de aguas, agua potable, SSHH, ventilación, iluminación, '
  'zona de desechos y equipos de frío.',
  7
)
ON CONFLICT (id) DO NOTHING;

-- ítems
INSERT INTO planilla_items
  (id, template_id, label, frequency, value_type, order_index, requires_document)
VALUES
  ('00000007-0001-0000-0000-000000000000', '00000001-0000-0000-0000-000000000007',
   'Pisos, Paredes y Cielos',                     'monthly', 'compliance',  1, FALSE),
  ('00000007-0002-0000-0000-000000000000', '00000001-0000-0000-0000-000000000007',
   'Cielos / Techumbre',                           'monthly', 'compliance',  2, FALSE),
  ('00000007-0003-0000-0000-000000000000', '00000001-0000-0000-0000-000000000007',
   'Ventanas y Puertas',                           'monthly', 'compliance',  3, FALSE),
  ('00000007-0004-0000-0000-000000000000', '00000001-0000-0000-0000-000000000007',
   'Estructuras Complementarias',                  'monthly', 'compliance',  4, FALSE),
  ('00000007-0005-0000-0000-000000000000', '00000001-0000-0000-0000-000000000007',
   'Superficies de Trabajo',                       'monthly', 'compliance',  5, FALSE),
  ('00000007-0006-0000-0000-000000000000', '00000001-0000-0000-0000-000000000007',
   'Evacuación de Aguas Lluvias/Servidas',         'monthly', 'compliance',  6, FALSE),
  ('00000007-0007-0000-0000-000000000000', '00000001-0000-0000-0000-000000000007',
   'Mantención General',                           'monthly', 'compliance',  7, FALSE),
  ('00000007-0008-0000-0000-000000000000', '00000001-0000-0000-0000-000000000007',
   'Abastecimiento de Agua (red interna)',         'monthly', 'compliance',  8, FALSE),
  ('00000007-0009-0000-0000-000000000000', '00000001-0000-0000-0000-000000000007',
   'Distribución de Agua Potable',                 'monthly', 'compliance',  9, FALSE),
  ('00000007-0010-0000-0000-000000000000', '00000001-0000-0000-0000-000000000007',
   'Servicios Higiénicos (público y personal)',    'monthly', 'compliance', 10, FALSE),
  ('00000007-0011-0000-0000-000000000000', '00000001-0000-0000-0000-000000000007',
   'Ventilación',                                  'monthly', 'compliance', 11, FALSE),
  ('00000007-0012-0000-0000-000000000000', '00000001-0000-0000-0000-000000000007',
   'Iluminación',                                  'monthly', 'compliance', 12, FALSE),
  ('00000007-0013-0000-0000-000000000000', '00000001-0000-0000-0000-000000000007',
   'Protección de Luminarias',                     'monthly', 'compliance', 13, FALSE),
  ('00000007-0014-0000-0000-000000000000', '00000001-0000-0000-0000-000000000007',
   'Lugar para Desechos',                          'monthly', 'compliance', 14, FALSE),
  ('00000007-0015-0000-0000-000000000000', '00000001-0000-0000-0000-000000000007',
   'Retiro de Desechos',                           'monthly', 'compliance', 15, FALSE),
  ('00000007-0016-0000-0000-000000000000', '00000001-0000-0000-0000-000000000007',
   'Equipos de Frío',                              'monthly', 'compliance', 16, FALSE)
ON CONFLICT (id) DO NOTHING;
