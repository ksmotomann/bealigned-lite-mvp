import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// BeAligned system prompt with Trina's empathetic approach
const systemPrompt = `You are a warm, empathetic co-parenting guide following the BeAligned/BeH2O methodology. 
Your tone is conversational, supportive, and gently curious - like a wise friend who deeply understands 
co-parenting challenges. You help users move from reaction to reflection, always keeping the child's wellbeing at center.

Key principles:
- Use warm, conversational language ("I hear you", "That sounds challenging", "Let's explore")
- Validate emotions before exploring deeper
- Ask one clear question at a time
- Gently probe for specifics when responses are vague
- Mirror back what you hear to ensure understanding
- Never judge or take sides
- Keep responses concise (2-3 sentences max)
- Guide toward child-centered solutions`

const stepGuidance = {
  1: {
    goal: "Help user clearly and neutrally name the co-parenting issue",
    initialPrompt: "Let's start by naming the issue. What's on your mind?",
    probes: [
      "Can you tell me more about what specifically is happening?",
      "How often does this situation come up?",
      "What's the impact this is having on your daily life?"
    ],
    completion: "When user has clearly described a specific situation or pattern"
  },
  2: {
    goal: "Explore both surface and vulnerable feelings",
    initialPrompt: "Thank you for sharing that. It's clear this situation is impacting you. What feelings are coming up as you think about this?",
    probes: [
      "Those are important feelings. What might be underneath the [feeling]?",
      "When you feel [feeling], what other emotions might be there too?",
      "Sometimes [surface feeling] can mask deeper feelings. What else might be there?"
    ],
    completion: "When user has identified both surface and deeper emotions"
  },
  3: {
    goal: "Identify core values and deeper purpose",
    initialPrompt: "I can really hear the emotions in what you've shared. Let's explore what's driving these feelings - what matters most to you in this situation?",
    probes: [
      "What value or principle feels threatened here?",
      "What are you hoping to protect or preserve?",
      "If this were resolved perfectly, what would that honor for you?"
    ],
    completion: "When user has identified their core values or deeper 'why'"
  },
  4: {
    goal: "Practice perspective-taking with the co-parent",
    initialPrompt: "Your values are so clear. Now let's take a brave step - if your co-parent were here, how might they describe this situation?",
    probes: [
      "What might be important to them in this situation?",
      "What feelings might they be experiencing?",
      "What needs might they be trying to meet?"
    ],
    completion: "When user has genuinely considered co-parent's perspective"
  },
  5: {
    goal: "Center the child's experience and needs",
    initialPrompt: "That took real courage to consider their perspective. Now let's focus on your child - what do you think they might be noticing or feeling?",
    probes: [
      "How might this be affecting their sense of security?",
      "What do you think they need most right now?",
      "What would help them feel safe and loved by both parents?"
    ],
    completion: "When user has identified child's needs and experience"
  },
  6: {
    goal: "Generate multiple win-win options",
    initialPrompt: "With all these perspectives in mind, let's brainstorm. What options might address everyone's needs - yours, your co-parent's, and especially your child's?",
    probes: [
      "What's another way this could work?",
      "How might you modify that option to address [specific need]?",
      "What would a creative solution look like?"
    ],
    completion: "When user has generated at least 3 viable options"
  },
  7: {
    goal: "Craft a CLEAR, respectful message",
    initialPrompt: "Excellent work exploring options. Now let's craft a message using the CLEAR approach - Concise, Listener-Ready, Essential, Appropriate, and Relevant. How would you like to express this?",
    probes: [
      "How could you make that more concise?",
      "What would make this easier for them to hear?",
      "Is there an invitation or question you'd like to include?"
    ],
    completion: "When user has drafted a clear, respectful message"
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { session_id, step_id, user_text } = await req.json()

    if (!session_id || !step_id || !user_text) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase
    let SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    if (!SUPABASE_URL?.startsWith('http')) {
      SUPABASE_URL = `https://${SUPABASE_URL || 'kzuumrtbroooxpneybyx.supabase.co'}`
    }

    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    if (!SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get conversation history for this step
    const { data: stepHistory } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', session_id)
      .eq('step_id', step_id)
      .order('created_at', { ascending: true })

    // Get all previous steps for context
    const { data: allResponses } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', session_id)
      .order('step_id', { ascending: true })

    // Build conversation context
    const stepConfig = stepGuidance[step_id as keyof typeof stepGuidance]
    const conversationTurns = stepHistory?.length || 0
    
    // Determine if we should probe deeper or mark complete
    const needsMoreDepth = conversationTurns < 2 && user_text.length < 50
    const isVague = user_text.split(' ').length < 10
    
    // Build context for AI
    const previousContext = allResponses
      ?.filter(r => r.step_id < step_id)
      ?.map(r => `Step ${r.step_id}: ${r.user_text}`)
      ?.join('\n')

    const currentStepHistory = stepHistory
      ?.map(r => `User: ${r.user_text}\nGuide: ${r.ai_text}`)
      ?.join('\n')

    // Call OpenAI
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
            content: `${systemPrompt}\n\nCurrent step ${step_id}: ${stepConfig.goal}\n\nPrevious context:\n${previousContext || 'None'}`
          },
          {
            role: 'user',
            content: `Step history:\n${currentStepHistory || 'None'}\n\nLatest response: "${user_text}"\n\n${
              needsMoreDepth || isVague 
                ? `This response seems brief. Gently probe deeper using one of these approaches: ${stepConfig.probes.join(' OR ')}`
                : `Acknowledge their response warmly and check if they'd like to add anything else before moving forward.`
            }\n\nRespond in 2-3 sentences max. Be warm, curious, and supportive.`
          }
        ],
        temperature: 0.8,
        max_tokens: 150
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error('AI service error')
    }

    const aiData = await openaiResponse.json()
    const aiText = aiData.choices?.[0]?.message?.content || "Thank you for sharing that with me."

    // Determine if step is complete
    const stepComplete = conversationTurns >= 2 && !isVague && !needsMoreDepth

    // Store response
    await supabase
      .from('responses')
      .insert({
        session_id,
        step_id,
        user_text,
        ai_text: aiText,
        knowledge_audit: {
          conversation_turn: conversationTurns + 1,
          step_complete: stepComplete,
          guidance_used: stepConfig.goal
        }
      })

    return new Response(
      JSON.stringify({
        ai_text: aiText,
        step_complete: stepComplete,
        knowledge_audit: {
          grounding_sources: ['BeAligned curriculum'],
          policy_checks: ['child_centered', 'empathetic', 'non_judgmental'],
          knowledge_version: '1.0'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})