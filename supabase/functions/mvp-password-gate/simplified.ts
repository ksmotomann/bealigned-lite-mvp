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

    // Compare password
    let isValid = false
    try {
      isValid = await bcrypt.compare(password, PASSWORD_HASH)
    } catch (bcryptError) {
      console.error('Bcrypt error:', bcryptError)
      return new Response(
        JSON.stringify({ error: 'Password validation error', details: bcryptError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Supabase URL - try both with and without https://
    let SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    if (!SUPABASE_URL) {
      return new Response(
        JSON.stringify({ error: 'SUPABASE_URL not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Ensure URL has https://
    if (!SUPABASE_URL.startsWith('http')) {
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
    let supabase
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    } catch (clientError) {
      console.error('Supabase client error:', clientError)
      return new Response(
        JSON.stringify({ error: 'Failed to create Supabase client', details: clientError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create session
    const sessionId = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    try {
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

    } catch (dbError) {
      console.error('Database operation error:', dbError)
      return new Response(
        JSON.stringify({ 
          error: 'Database operation failed', 
          details: dbError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})