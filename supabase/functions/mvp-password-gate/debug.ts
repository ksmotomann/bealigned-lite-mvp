import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Debug: Check what environment variables are available
  const envCheck = {
    has_PASSWORD_GATE_HASH: !!Deno.env.get('PASSWORD_GATE_HASH'),
    has_SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
    has_SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    SUPABASE_URL_value: Deno.env.get('SUPABASE_URL')?.substring(0, 30) + '...',
    SERVICE_KEY_length: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.length || 0
  }

  return new Response(
    JSON.stringify({ 
      message: 'Debug info',
      env: envCheck,
      timestamp: new Date().toISOString()
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
})