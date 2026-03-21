# Variables de entorno para Edge Functions

Configúralas en Supabase Dashboard → Settings → Edge Functions → Secrets

## Variables requeridas

| Variable | Descripción |
|---|---|
| `MP_ACCESS_TOKEN` | Token de acceso de MercadoPago (producción o sandbox) |
| `APP_URL` | URL base del app: `https://www.restobpm.cl` |

## Cómo obtener MP_ACCESS_TOKEN

1. Ir a https://www.mercadopago.cl/developers/panel/app
2. Crear una aplicación (o usar una existente)
3. En "Credenciales de producción" → copiar el **Access Token**
4. Para pruebas, usar las **Credenciales de prueba** (empieza con `TEST-`)

## Comandos Supabase CLI para deploy

```bash
# Instalar Supabase CLI (si no está instalado)
npm install -g supabase

# Login
supabase login

# Deploy ambas funciones
supabase functions deploy create-payment  --project-ref vzifxridfoduqxvsjljy
supabase functions deploy payment-webhook --project-ref vzifxridfoduqxvsjljy

# Setear secrets
supabase secrets set MP_ACCESS_TOKEN=TU_TOKEN_AQUI --project-ref vzifxridfoduqxvsjljy
supabase secrets set APP_URL=https://www.restobpm.cl  --project-ref vzifxridfoduqxvsjljy
```

## URL del webhook (para configurar en MercadoPago)

```
https://vzifxridfoduqxvsjljy.supabase.co/functions/v1/payment-webhook
```

Configurarlo en MercadoPago Dashboard → Tu Aplicación → Webhooks → Eventos: `payment`
