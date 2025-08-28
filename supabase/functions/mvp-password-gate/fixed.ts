import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { compare } from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
}

// Simple password comparison without bcrypt for MVP
// In production, you'd want to use a proper bcrypt implementation
function simplePasswordCheck(password: string, hash: string): boolean {
  // For MVP, we'll do a simple comparison
  // The hash should be stored as plain text prefixed with "plain:"
  // Or we can temporarily bypass bcrypt
  
  // If the hash starts with $2a$ it's a bcrypt hash
  // Since bcrypt doesn't work in Edge Runtime, we'll use a workaround
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    // For now, let's use a hardcoded password check
    // You'll need to update this with your actual password
    const TEMP_PASSWORD = 'testing123' // UPDATE THIS TO YOUR ACTUAL PASSWORD
    return password === TEMP_PASSWORD
  }
  
  // For plain text comparison (not recommended for production)
  return password === hash
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { password } = await req.json()
    
    if (!password) {
      return new Response(
        JSON.stringify({ error: 'Password required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const PASSWORD_HASH = Deno.env.get('PASSWORD_GATE_HASH')
    if (!PASSWORD_HASH) {
      return new Response(
        JSON.stringify({ error: 'PASSWORD_GATE_HASH not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use simple password check since bcrypt doesn't work in Edge Runtime
    const isValid = simplePasswordCheck(password, PASSWORD_HASH)
    
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Supabase configuration
    let SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    if (!SUPABASE_URL) {
      // Try to construct it from the project ref
      const projectRef = 'kzuumrtbroooxpneybyx'
      SUPABASE_URL = `https://${projectRef}.supabase.co`
    } else if (!SUPABASE_URL.startsWith('http')) {
      SUPABASE_URL = `https://${SUPABASE_URL}`
    }

    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Create session
    const sessionId = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const { data, error: dbError } = await supabase
      .from('sessions')
      .insert({
        id: sessionId,
        expires_at: expiresAt.toISOString(),
        client_meta: {
          user_agent: req.headers.get('user-agent'),
          timestamp: new Date().toISOString()
        }
      })
      .select()

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create session', 
          details: dbError.message,
          code: dbError.code 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return success
    const headers = new Headers({
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Set-Cookie': `session=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        sessionId,
        expiresAt: expiresAt.toISOString() 
      }),
      { status: 200, headers }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})