/**
 * create-payment — Supabase Edge Function
 *
 * Crea una preferencia de pago en MercadoPago Checkout Pro.
 * Llamada desde el cliente React cuando el usuario hace click en "Contratar".
 *
 * POST /functions/v1/create-payment
 * Body: { planId: 'inicial' | 'total' | 'sucursales', tenantId: string }
 * Returns: { init_point: string }  ← URL de pago de MercadoPago
 *
 * Variables de entorno requeridas en Supabase:
 *   MP_ACCESS_TOKEN  — Token de acceso de MercadoPago (productivo o sandbox)
 *   APP_URL          — URL base del app, e.g. https://www.restobpm.cl
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Definición de planes
const PLANS: Record<string, { title: string; price: number; currency: string }> = {
  inicial:    { title: 'RestoBPM — Cumplimiento Inicial',    price: 14990, currency: 'CLP' },
  total:      { title: 'RestoBPM — Cumplimiento Total',      price: 19900, currency: 'CLP' },
  sucursales: { title: 'RestoBPM — Múltiples Sucursales',    price: 39900, currency: 'CLP' },
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { planId, tenantId } = await req.json()

    if (!planId || !tenantId) {
      return new Response(JSON.stringify({ error: 'planId y tenantId son requeridos' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const plan = PLANS[planId]
    if (!plan) {
      return new Response(JSON.stringify({ error: 'Plan no válido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verificar que el tenant existe (usando la clave anónima para leer)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, rut')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return new Response(JSON.stringify({ error: 'Tenant no encontrado' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const mpToken  = Deno.env.get('MP_ACCESS_TOKEN')!
    const appUrl   = Deno.env.get('APP_URL') ?? 'https://www.restobpm.cl'
    const externalRef = `${tenantId}|${planId}` // se devuelve en el webhook

    // Crear preferencia en MercadoPago
    const preference = {
      items: [{
        id: planId,
        title: plan.title,
        quantity: 1,
        unit_price: plan.price,
        currency_id: plan.currency,
      }],
      payer: {
        name: tenant.name,
      },
      external_reference: externalRef,
      back_urls: {
        success: `${appUrl}/admin/subscription?pago=exitoso`,
        failure: `${appUrl}/admin/subscription?pago=fallido`,
        pending: `${appUrl}/admin/subscription?pago=pendiente`,
      },
      auto_return: 'approved',
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`,
      statement_descriptor: 'RESTOBPM',
      metadata: { tenant_id: tenantId, plan_id: planId },
    }

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mpToken}`,
      },
      body: JSON.stringify(preference),
    })

    if (!mpRes.ok) {
      const err = await mpRes.text()
      console.error('MercadoPago error:', err)
      return new Response(JSON.stringify({ error: 'Error al crear preferencia de pago' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const mpData = await mpRes.json()

    return new Response(JSON.stringify({
      init_point:       mpData.init_point,       // checkout productivo
      sandbox_init_point: mpData.sandbox_init_point, // para pruebas
      preference_id:    mpData.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('create-payment error:', err)
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
