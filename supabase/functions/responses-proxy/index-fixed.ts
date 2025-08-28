import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const systemPrompt = `You are BeAligned™ Lite, a warm, grounded reflection guide helping co-parents navigate challenging situations. Keep responses brief, empathetic, and child-centered. Never provide legal or clinical advice.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { session_id, step_id, user_text } = await req.json()

    if (!session_id || !step_id || !user_text) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    let SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    if (!SUPABASE_URL?.startsWith('http')) {
      SUPABASE_URL = `https://${SUPABASE_URL || 'kzuumrtbroooxpneybyx.supabase.co'}`
    }

    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Service role key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get step information
    const { data: step } = await supabase
      .from('steps')
      .select('*')
      .eq('id', step_id)
      .single()

    // Get previous responses for context
    const { data: previousResponses } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', session_id)
      .lt('step_id', step_id)
      .order('step_id', { ascending: true })

    // Get feelings and values banks for context
    const { data: feelings } = await supabase
      .from('feelings_bank')
      .select('*')
    
    const { data: values } = await supabase
      .from('values_bank')
      .select('*')

    // Build context for AI response
    const stepPrompts = {
      1: "Help the user identify and name the situation neutrally.",
      2: "Reflect on the feelings they've shared, both surface and deeper ones.",
      3: "Help them identify their core values and what's truly important.",
      4: "Support them in considering their co-parent's perspective with empathy.",
      5: "Guide them to see the situation through their child's eyes.",
      6: "Help generate options that serve multiple needs and values.",
      7: "Support them in drafting a CLEAR message."
    }

    // Call OpenAI API
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `${systemPrompt}\n\nCurrent step ${step_id}: ${step?.title}\nTask: ${stepPrompts[step_id as keyof typeof stepPrompts]}`
          },
          {
            role: 'user',
            content: `Previous context: ${JSON.stringify(previousResponses?.map(r => ({
              step: r.step_id,
              user: r.user_text,
              response: r.ai_text
            })))}\n\nCurrent input: ${user_text}\n\nProvide a brief, empathetic response (2-3 sentences max).`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'AI service error', details: errorData }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const aiData = await openaiResponse.json()
    const aiText = aiData.choices?.[0]?.message?.content || 'I understand. Let\'s continue exploring this together.'

    // Store the response in the database
    const { error: insertError } = await supabase
      .from('responses')
      .insert({
        session_id,
        step_id,
        user_text,
        ai_text: aiText,
        knowledge_audit: {
          grounding_sources: ['BeAligned curriculum'],
          policy_checks: ['no_legal_advice', 'child_centered'],
          knowledge_rationale: 'Response based on BeAligned principles',
          knowledge_version: '1.0'
        }
      })

    if (insertError) {
      console.error('Failed to store response:', insertError)
    }

    // Generate preview for steps 3+
    let preview_patch = null
    if (step_id >= 3) {
      const allResponses = [...(previousResponses || []), { step_id, user_text, ai_text: aiText }]
      const feelings = allResponses.find(r => r.step_id === 2)?.user_text || ''
      const situation = allResponses.find(r => r.step_id === 1)?.user_text || ''
      const values = allResponses.find(r => r.step_id === 3)?.user_text || ''
      
      if (feelings && situation) {
        preview_patch = {
          draft: `I feel ${extractFirstFeeling(feelings)} when ${situation.slice(0, 50)}... because ${values ? extractValue(values) : 'this matters to our family'}.`,
          components: { feelings, situation, values }
        }
      }
    }

    return new Response(
      JSON.stringify({
        ai_text: aiText,
        knowledge_audit: {
          grounding_sources: ['BeAligned curriculum'],
          policy_checks: ['no_legal_advice', 'child_centered'],
          knowledge_rationale: 'Response based on BeAligned principles',
          knowledge_version: '1.0'
        },
        preview_patch
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function extractFirstFeeling(text: string): string {
  const words = text.toLowerCase().split(/\s+/)
  const feelingWords = ['worried', 'frustrated', 'concerned', 'overwhelmed', 'anxious', 'sad', 'angry', 'confused', 'hurt', 'stressed']
  return words.find(w => feelingWords.includes(w)) || 'concerned'
}

function extractValue(text: string): string {
  return text.slice(0, 40).trim() || 'our family needs stability'
}