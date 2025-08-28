import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header - Supabase requires this
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const { password } = await req.json()
    
    if (!password) {
      return new Response(
        JSON.stringify({ error: 'Password required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get password hash from environment
    const PASSWORD_HASH = Deno.env.get('PASSWORD_GATE_HASH')
    if (!PASSWORD_HASH) {
      console.error('PASSWORD_GATE_HASH not configured')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify password
    const isValid = await bcrypt.compare(password, PASSWORD_HASH)
    
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid password' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })

    // Create session
    const sessionId = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const { error: dbError } = await supabase
      .from('sessions')
      .insert({
        id: sessionId,
        expires_at: expiresAt.toISOString(),
        client_meta: {
          user_agent: req.headers.get('user-agent'),
          timestamp: new Date().toISOString()
        }
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Return success with session cookie
    const headers = new Headers({
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Set-Cookie': `session=${sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        sessionId,
        expiresAt: expiresAt.toISOString() 
      }),
      { 
        status: 200,
        headers
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}, {
  // This is important - it tells Deno to listen on the correct port
  port: 8000
})