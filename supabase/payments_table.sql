-- ═══════════════════════════════════════════════════════════════════════════
-- Tabla payments — registro de pagos aprobados via MercadoPago
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS payments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id        text NOT NULL,
  mp_payment_id  text UNIQUE,
  amount         numeric(10,2),
  currency       text DEFAULT 'CLP',
  status         text NOT NULL DEFAULT 'approved',
  paid_at        timestamptz,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Solo el superadmin (service role) puede leer todos los pagos
-- El admin del tenant puede ver sus propios pagos
CREATE POLICY "tenant_own_payments" ON payments
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Solo el webhook (service role) puede insertar
-- No se necesita política de INSERT para usuarios normales

-- Índices
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_mp_id  ON payments(mp_payment_id);
