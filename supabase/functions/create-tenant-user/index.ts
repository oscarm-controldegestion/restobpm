/**
 * create-tenant-user — Supabase Edge Function
 *
 * Crea un usuario operador/supervisor dentro de un tenant.
 * Usa la service role key para llamar auth.admin API.
 *
 * POST /functions/v1/create-tenant-user
 * Headers: Authorization: Bearer <user_access_token>  (del admin logueado)
 * Body: { email, fullName, rut, role, tenantId }
 * Returns: { userId, tempPassword }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verificar que el llamador es un admin válido del tenant
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'No autorizado' }, 401)
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user: caller }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !caller) {
      return json({ error: 'Token inválido' }, 401)
    }

    // Verificar que el caller es admin del tenant indicado
    const { email, fullName, rut, role, tenantId } = await req.json()

    const { data: callerProfile } = await supabaseUser
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', caller.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'admin' || callerProfile.tenant_id !== tenantId) {
      return json({ error: 'Solo el administrador del establecimiento puede crear usuarios' }, 403)
    }

    // Validaciones básicas
    if (!email || !fullName || !role || !tenantId) {
      return json({ error: 'email, fullName, role y tenantId son requeridos' }, 400)
    }
    if (!['operator', 'supervisor'].includes(role)) {
      return json({ error: 'Rol no válido. Usa: operator, supervisor' }, 400)
    }

    // 2. Crear usuario Auth usando service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Contraseña temporal: 8 chars alfanuméricos + mayúscula + número
    const tempPassword = generateTempPassword()

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email:         email.trim().toLowerCase(),
      password:      tempPassword,
      email_confirm: true,   // confirmado de inmediato
      user_metadata: { full_name: fullName.trim() },
    })

    if (createError || !newUser.user) {
      const msg = createError?.message ?? 'Error al crear usuario'
      // Mensaje amigable para correo duplicado
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        return json({ error: 'Este correo electrónico ya está registrado en el sistema.' }, 409)
      }
      return json({ error: msg }, 500)
    }

    // 3. Crear perfil dentro del tenant
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id:        newUser.user.id,
      tenant_id: tenantId,
      full_name: fullName.trim(),
      rut:       rut?.trim() ?? null,
      role,
      active: true,
    })

    if (profileError) {
      // Rollback: eliminar el auth user si el perfil falló
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return json({ error: 'Error al crear el perfil del usuario.' }, 500)
    }

    return json({ userId: newUser.user.id, tempPassword }, 200)

  } catch (err) {
    console.error('create-tenant-user error:', err)
    return json({ error: 'Error interno del servidor' }, 500)
  }
})

function generateTempPassword(): string {
  const chars  = 'abcdefghjkmnpqrstuvwxyz'
  const upper  = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const digits = '23456789'
  let pw = ''
  for (let i = 0; i < 6; i++) pw += chars[Math.floor(Math.random() * chars.length)]
  pw += upper[Math.floor(Math.random() * upper.length)]
  pw += digits[Math.floor(Math.random() * digits.length)]
  // mezclar
  return pw.split('').sort(() => Math.random() - 0.5).join('')
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...{ 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }, 'Content-Type': 'application/json' }
  })
}
