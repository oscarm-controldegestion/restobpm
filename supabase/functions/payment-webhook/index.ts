/**
 * payment-webhook — Supabase Edge Function
 *
 * Recibe notificaciones de pago desde MercadoPago (IPN).
 * Cuando el pago es aprobado, actualiza el plan del tenant en Supabase.
 *
 * Variables de entorno requeridas:
 *   MP_ACCESS_TOKEN         — Token de acceso de MercadoPago
 *   SUPABASE_URL            — URL del proyecto Supabase (auto-inyectado)
 *   SUPABASE_SERVICE_ROLE_KEY — Clave de servicio (auto-inyectado)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeo plan_id → duración de suscripción en días
const PLAN_DURATION_DAYS = 30  // mensual

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const topic  = url.searchParams.get('topic')  || url.searchParams.get('type')
    const dataId = url.searchParams.get('data.id') || url.searchParams.get('id')

    console.log('Webhook recibido:', { topic, dataId })

    // Solo procesamos notificaciones de pago
    if (topic !== 'payment' && topic !== 'merchant_order') {
      return new Response('ok', { status: 200 })
    }

    if (!dataId) {
      return new Response('missing id', { status: 400 })
    }

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')!

    // Consultar el pago en MercadoPago
    const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: { 'Authorization': `Bearer ${mpToken}` }
    })

    if (!payRes.ok) {
      console.error('Error consultando pago:', await payRes.text())
      return new Response('error', { status: 500 })
    }

    const payment = await payRes.json()
    console.log('Payment status:', payment.status, 'external_ref:', payment.external_reference)

    // Solo procesar pagos aprobados
    if (payment.status !== 'approved') {
      return new Response('not approved', { status: 200 })
    }

    // Extraer tenantId y planId del external_reference  (formato: "tenantId|planId")
    const [tenantId, planId] = (payment.external_reference ?? '').split('|')
    if (!tenantId || !planId) {
      console.error('external_reference inválido:', payment.external_reference)
      return new Response('invalid ref', { status: 400 })
    }

    // Actualizar el tenant en Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + PLAN_DURATION_DAYS)

    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        plan:             planId,
        plan_expires_at:  expiresAt.toISOString(),
      })
      .eq('id', tenantId)

    if (updateError) {
      console.error('Error actualizando tenant:', updateError)
      return new Response('db error', { status: 500 })
    }

    // Registrar el pago en la tabla payments
    await supabase.from('payments').insert({
      tenant_id:       tenantId,
      plan_id:         planId,
      mp_payment_id:   String(payment.id),
      amount:          payment.transaction_amount,
      currency:        payment.currency_id,
      status:          payment.status,
      paid_at:         payment.date_approved,
    }).throwOnError()

    console.log(`✓ Tenant ${tenantId} actualizado a plan ${planId}`)
    return new Response('ok', { status: 200 })

  } catch (err) {
    console.error('payment-webhook error:', err)
    return new Response('error', { status: 500 })
  }
})
