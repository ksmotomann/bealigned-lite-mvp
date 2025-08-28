import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// BeAligned™ Beta Lite system prompt from BABL Revised Operating Instructions
const systemPrompt = `You are BeAligned™ Beta Lite — a warm, grounded, nonjudgmental reflection bot built to support one co-parent in thinking through a current challenge. Your goal is to guide the user through a 7-phase reflective process rooted in the BeH2O® communication framework and BeAligned™ mindset. You help the user uncover their deeper purpose ("why"), consider the perspectives of others, and move toward aligned, child-centered communication.

You are NOT a therapist, mediator, or legal advisor. You do not make decisions or take sides. You do not use robotic scripts or generic advice. Your job is to invite clarity, calm, and compassion — step by step.

CONVERSATIONAL APPROACH:
- Respond naturally and warmly in your validation and reflections
- Use the EXACT BeAligned prompts provided - DO NOT paraphrase or modify them
- Acknowledge what the user shares with genuine validation before asking the exact prompt
- Be conversational in your reflections but use prompts VERBATIM
- Stay present with their emotions and reflect back what you're hearing
- Build on their responses with curiosity and compassion
- SYNTHESIZE themes from across phases - connect current insights to earlier emotions and values
- When transitioning phases, offer brief reflective summaries that help users see connections
- Validate the depth and significance of what's been shared CONCISELY
- Be CONCISE per BeH2O CLEAR principles - 2-3 sentences maximum
- Build cumulatively - reference earlier insights to show the journey's progression

PHASE PROGRESSION:
- Stay in the current phase until the completion criteria is genuinely met
- When transitioning, use warm acknowledgment + natural bridge to next phase
- Don't announce phase changes - let them flow naturally
- Ask one thoughtful question at a time

Key principles:
- Always respond with warmth, neutrality, and reflection
- Remind the user that alignment doesn't mean agreement — it means being centered on what matters most
- Invite emotional regulation or pause if the user seems escalated
- If asked, provide lists of feelings or needs from the internal glossary
- You don't have to solve the problem — you help the user uncover the path forward
- Meet them where they are emotionally and help them go deeper
- Never judge or take sides - stay curious and supportive`

const stepGuidance = {
  1: {
    title: "LET'S NAME IT",
    goal: "Invite the user to name one issue that's been on their mind",
    initialPrompt: "What's the situation that's been sticking with you lately?",
    probes: [
      "Can you tell me more about what specifically is happening?",
      "How often does this situation come up?",
      "What's the impact this is having on your daily life?"
    ],
    guidance: "Reflect what they share and thank them for naming it.",
    completion: "When user has clearly described a specific situation or pattern",
    transition: "Thank you for naming that. I can hear that this is really affecting you."
  },
  2: {
    title: "WHAT'S BENEATH THAT?",
    goal: "Help them explore surface and core emotions",
    initialPrompt: "What feelings come up when you think about this?",
    probes: [
      "Sometimes anger masks hurt or control masks fear. What might be underneath that?",
      "What does that feeling say about what matters to you here?",
      "Those are important feelings. What might be underneath those emotions?"
    ],
    guidance: "Invite insight about what these feelings say about what matters to them.",
    completion: "When user has identified both surface and deeper emotions",
    transition: "Thank you for being so open about your feelings. It takes courage to explore what's really going on underneath."
  },
  3: {
    title: "YOUR WHY",
    goal: "Help the user clarify their deeper purpose or values",
    initialPrompt: "What is it about this that feels important to you?",
    probes: [
      "What are you hoping for — for your child, for yourself, or for the relationship?",
      "What's your bigger why here? What do you care about that's showing up in this?",
      "What value or principle feels threatened here?"
    ],
    guidance: "Help them identify what they're hoping for — for their child, for themselves, or for the relationship.",
    completion: "When user has identified their core values or deeper 'why'",
    transition: "Your values are so clear. Holding onto those, let's take a brave step and consider your co-parent's perspective."
  },
  4: {
    title: "STEP INTO YOUR CO-PARENT'S SHOES",
    goal: "Encourage empathy without justification",
    initialPrompt: "If your co-parent described this, how might they see it?",
    probes: [
      "Even if you don't agree, what do you imagine they're feeling or needing?",
      "What might be driving their reaction? What do they care about, in their own way?",
      "What needs might they be trying to meet?"
    ],
    guidance: "Help the user name their co-parent's possible 'why.' Encourage empathy without justification.",
    completion: "When user has genuinely considered co-parent's perspective",
    transition: "That took real courage to see things from their perspective. Now let's center your child's experience."
  },
  5: {
    title: "SEE THROUGH YOUR CHILD'S EYES",
    goal: "Help the user center the child's experience",
    initialPrompt: "What might your child be noticing about this?",
    probes: [
      "How might they be feeling? What might they need right now — not from either parent, but in general?",
      "What might your child hope you both do next?",
      "What would help them feel safe and loved by both parents?"
    ],
    guidance: "Focus on what the child needs in general, not from either parent specifically.",
    completion: "When user has identified child's needs and experience",
    transition: "You've done beautiful work centering your child's needs."
  },
  6: {
    title: "EXPLORE ALIGNED OPTIONS",
    goal: "Help them generate 2–3 ideas that honor all three perspectives",
    initialPrompt: "Given everything we've explored — your why, your co-parent's possible why, your child's needs — what ideas come to mind?",
    probes: [
      "What's another way this could work?",
      "How might you modify that to honor everyone's needs?",
      "What would a creative solution look like that works for all three perspectives?"
    ],
    guidance: "Offer to help summarize if they're unsure. Generate 2-3 options that honor all perspectives.",
    completion: "When user has generated at least 2-3 viable options that honor all perspectives",
    transition: "These are some really thoughtful options. You've found ways to honor everyone's needs."
  },
  7: {
    title: "CHOOSE + COMMUNICATE",
    goal: "Use the CLEAR framework to guide the message",
    initialPrompt: "Which of these feels most aligned with everyone's needs?",
    probes: [
      "Would you like help crafting a message that reflects shared purpose and CLEAR communication?",
      "How could you make that more concise while keeping it warm?",
      "What would make this easier for your co-parent to hear and engage with?"
    ],
    guidance: "Use CLEAR framework: Concise, Listener-Ready, Essential, Appropriate, Relevant.",
    completion: "When user has drafted a clear, respectful message that reflects shared purpose",
    transition: "You've done incredible work through all seven phases! Remember, alignment doesn't mean agreement — it means being centered on what matters most."
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { session_id, step_id, user_text, override_response, is_refinement } = await req.json()

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

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
      return new Response(
        JSON.stringify({ error: 'Configuration error: Missing SUPABASE_SERVICE_ROLE_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!OPENAI_API_KEY) {
      console.error('Missing OPENAI_API_KEY')
      return new Response(
        JSON.stringify({ error: 'Configuration error: Missing OPENAI_API_KEY. Please set it in Edge Function secrets.' }),
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
    
    // Enhanced completion detection - more nuanced per step
    const userWords = user_text.split(' ').length
    const userSentences = user_text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    
    // Build cumulative context from all responses in this step
    const allStepText = stepHistory?.map(r => r.user_text).join(' ') || ''
    const cumulativeWords = allStepText.split(' ').length + userWords
    
    // Check for quality indicators
    const hasSpecifics = /\b(because|when|every|always|often|sometimes|yesterday|today|last week|Monday|Tuesday|Wednesday|Thursday|Friday|weekend)\b/i.test(user_text)
    const hasEmotions = /\b(feel|felt|feeling|angry|sad|frustrated|hurt|worried|scared|happy|anxious|overwhelmed|disappointed)\b/i.test(user_text)
    
    // Check if they've named a concrete issue (Phase 1 specific)
    const hasNamedIssue = /\b(is|are|was|were|keeps|won't|doesn't|always|never|refuses|insists|demands|wants|needs|struggling|feeling|not)\b/i.test(user_text)
    const hasSubject = /\b(co-?parent|ex|they|he|she|mother|father|mom|dad|partner|attorney|lawyer|mediator|court|judge|GAL|custody|visitation|parenting time|counselor|therapist|school|teacher|child|kids|son|daughter)\b/i.test(user_text)
    
    // Check if response is clearly articulated and complete
    const isClearlyArticulated = userWords >= 10 && (hasNamedIssue || hasEmotions) && hasSubject
    
    // Check for emotional complexity (multiple emotions or emotional nuance)
    const hasEmotionalComplexity = (user_text.match(/\b(feel|feeling|felt|angry|sad|frustrated|hurt|worried|scared|happy|anxious|overwhelmed|disappointed|trapped|unseen|grateful|wrestling)\b/gi)?.length >= 2) || 
      /\b(simultaneously|both|also|but|however|though|while|mixed|complex)\b/i.test(user_text)
    
    // Check for values/motivations language (indicates they're expressing their "why")
    const hasValuesLanguage = /\b(protect|advocate|support|family|future|long-term|security|resources|strength|depleted|sustainable|maintain|preserve|ensure|provide|care|love|safe|safety|stability|stable)\b/i.test(user_text) ||
      /\b(important|value|matters|believe|need|want|hope|why|because|purpose|goal|priority|faith|christ|god|kingdom|heaven|witness|legacy|mission|calling|sacred|eternal|grounded|rooted)\b/i.test(user_text)
    
    // Check for user completion signals - they're ready to move on
    const userSignalsCompletion = /\b(that's it|thats it|that's really it|thats really it|that's all|thats all|i'm done|im done|let's move on|lets move on|next|move forward|i'm ready|im ready|that works|finished|complete|done|enough)\b/i.test(user_text) ||
      /^(yep|yes|yeah|ok|okay|sure|exactly|precisely|correct)\.?$|^(that's|thats)\s+(it|all|enough)\.?$|^(i'm|im)\s+(done|ready|finished)\.?$/i.test(user_text.trim())
    
    // Check for user fatigue/readiness signals - short responses that suggest they want to move on
    const userShowsFatigue = (userWords <= 3 && conversationTurns >= 1) || // Very short responses after engagement
      (userWords <= 5 && conversationTurns >= 2) || // Short responses after multiple turns
      /^(my\s+\w+|the\s+\w+|just\s+\w+|yes|no|maybe|sure|okay|idk|dunno)\.?$/i.test(user_text.trim()) // Minimal/tired responses
    
    // Combined completion signal - explicit signals OR signs of fatigue with some engagement
    const userWantsToProgress = userSignalsCompletion || (userShowsFatigue && conversationTurns >= 1)
    
    // Step-specific completion checks - MINIMAL prompting, fast progression
    const stepCompletionChecks = {
      1: hasNamedIssue || userWords >= 5,  // Progress immediately if issue is clear
      2: hasEmotions || conversationTurns >= 1, // One response about feelings is enough
      3: userWords >= 8 || conversationTurns >= 1, // Quick progression after any substantive response
      4: userWords >= 5 || conversationTurns >= 1, // Any attempt at perspective-taking
      5: userWords >= 5 || conversationTurns >= 1, // Any response about child
      6: conversationTurns >= 1, // One response generates options
      7: conversationTurns >= 1 // One response to craft message
    }
    
    const meetsStepRequirements = stepCompletionChecks[step_id as keyof typeof stepCompletionChecks] || false
    const needsMoreDepth = !meetsStepRequirements && conversationTurns < 2 && !userWantsToProgress  // Quick progression
    const isVague = userWords < 3 && !hasSpecifics && !hasEmotions && !userShowsFatigue  // Very lenient
    
    // Determine if we should auto-progress to next step - FAST progression
    // Allow progression on first turn if response has substance
    const hasMinimumDepth = step_id === 1 
      ? isClearlyArticulated || (conversationTurns >= 1 && cumulativeWords >= 15)
      : conversationTurns >= 1 && cumulativeWords >= 15
    // If user wants to progress (explicit signal OR fatigue), honor that
    const stepComplete = userWantsToProgress || (meetsStepRequirements && (hasMinimumDepth || isClearlyArticulated) && !isVague)
    const shouldAutoProgress = stepComplete && step_id < 7
    
    // Get next step info if progressing
    const nextStepConfig = shouldAutoProgress ? stepGuidance[(step_id + 1) as keyof typeof stepGuidance] : null
    
    // Debug logging for phase progression
    console.log('Phase analysis:', {
      step: step_id,
      input: user_text.substring(0, 50) + '...',
      words: userWords,
      turns: conversationTurns,
      hasNamedIssue,
      hasSubject,
      hasEmotions,
      hasValuesLanguage,
      userSignalsCompletion,
      userShowsFatigue,
      userWantsToProgress,
      isClearlyArticulated,
      meetsStepRequirements,
      shouldProgress: shouldAutoProgress
    })
    
    // Build context for AI
    const previousContext = allResponses
      ?.filter(r => r.step_id < step_id)
      ?.map(r => `Step ${r.step_id}: ${r.user_text}`)
      ?.join('\n')

    const currentStepHistory = stepHistory
      ?.map(r => `User: ${r.user_text}\nGuide: ${r.ai_text}`)
      ?.join('\n')

    // Get refinement examples to guide the AI (not replace it)
    let refinementContext = ''
    try {
      const { data: bestRefinement } = await supabase
        .rpc('get_best_refinement', {
          p_step_id: step_id,
          p_user_text: user_text
        })
        .single()
      
      if (bestRefinement && bestRefinement.confidence >= 0.7) {
        const exampleResponse = bestRefinement.use_chatgpt 
          ? bestRefinement.chatgpt_response 
          : bestRefinement.refined_text
        
        if (exampleResponse) {
          refinementContext = `\n\nExample of a good response for similar input: "${exampleResponse}"\nUse this as inspiration but create your own response following the exact phase prompts.`
        }
      }
    } catch (error) {
      // Refinements are optional - don't break if unavailable
      console.log('Could not load refinements:', error)
    }

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
            content: `${systemPrompt}\n\nCurrent step ${step_id}: ${stepConfig.goal}\nGuidance: ${stepConfig.guidance}\n\nPrevious context:\n${previousContext || 'None'}${refinementContext}`
          },
          {
            role: 'user',
            content: `Step history:\n${currentStepHistory || 'None'}\n\nLatest response: "${user_text}"\n\n${
              shouldAutoProgress
                ? `PHASE TRANSITION - Be CONCISE per BeH2O CLEAR principles.

${userSignalsCompletion ? 'Acknowledge their readiness to move forward' : userShowsFatigue ? 'Honor their brief response' : 'Validate'}: "${stepConfig.transition}"

Brief synthesis connecting this phase to their journey. Reference ONE specific thing they said.

---

**${step_id + 1}. ${nextStepConfig?.title}**
**${nextStepConfig?.initialPrompt}**

BE CONCISE: 2-3 sentences MAX before the separator. Use the EXACT prompt shown above - copy it VERBATIM, do NOT paraphrase.`
                : step_id === 7 && stepComplete
                  ? `FINAL PHASE COMPLETION - Create a comprehensive, beautifully formatted response that synthesizes their entire 7-phase journey.

SYNTHESIS INSTRUCTIONS:
1. Review ALL previous conversation history to understand their complete journey
2. Create a thoughtful, well-structured response using this EXACT format:

${stepConfig.transition}

**Here's what I'm hearing from your reflection journey:**

You started by naming [synthesize their issue]. What struck me was how you expressed [reflect their core emotions], particularly [specific emotion]. But beneath that, your deeper why became beautifully clear: [their values/faith/purpose].

When you stepped into your co-parent's shoes, you recognized [their perspective]. And from your child's perspective, you saw [child's needs/experience]. This led you to explore solutions that honor everyone's needs.

---

**Your CLEAR Message to Your Co-Parent:**

"I feel [specific emotion from their journey] when [specific situation they named] because [child-centered shared outcome reflecting their why]. [Collaborative invitation based on their chosen approach]"

---

**Moving Forward:**

This message reflects your commitment to [their core values] while staying focused on [child's wellbeing]. It's listener-ready, centers your child's needs, and opens the door for collaboration rather than conflict.

Remember: alignment doesn't mean agreement — it means staying centered on what matters most.

CRITICAL: Make this response deeply thoughtful, well-formatted with sections and horizontal lines (---), and show you truly understand their complete journey. Match the sophistication and care of the ChatGPT sample.`
                : needsMoreDepth || isVague 
                  ? `DEEPER EXPLORATION - Be CONCISE:

Validate briefly (1 sentence). ${stepConfig.guidance}

**${stepConfig.probes[Math.min(conversationTurns, stepConfig.probes.length - 1)]}**`
                : conversationTurns === 0 && !meetsStepRequirements
                  ? `FIRST RESPONSE - Be CONCISE:

${stepConfig.guidance} Acknowledge what you heard (1-2 sentences).

**${stepConfig.initialPrompt}**`
                : `CONTINUING EXPLORATION - Be CONCISE:

Reflect and validate (1-2 sentences). ${stepConfig.guidance}

**${stepConfig.probes[Math.min(conversationTurns - 1, stepConfig.probes.length - 1)]}**`
            }\n\nCRITICAL INSTRUCTIONS:
1. Be CONCISE per BeH2O CLEAR principles - Use 2-3 sentences MAX for validation/reflection
2. ALWAYS use the EXACT prompt text provided above in bold - DO NOT paraphrase or create your own questions
3. The bold prompt must be VERBATIM as shown - copy it exactly word-for-word
4. Get to the point quickly while remaining warm and professional`
          }
        ],
        temperature: 0.7,  // Natural, conversational responses
        max_tokens: step_id === 7 && stepComplete ? 400 : 250 // CONCISE per BeH2O principles
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI API error:', openaiResponse.status, errorData)
      throw new Error(`OpenAI API error ${openaiResponse.status}: ${errorData}`)
    }

    const aiData = await openaiResponse.json()
    let aiText = aiData.choices?.[0]?.message?.content
    
    // Log for debugging
    console.log('User input:', user_text)
    console.log('Completion signal test:', userSignalsCompletion)
    console.log('Fatigue signal test:', userShowsFatigue)
    console.log('AI response:', aiText)
    
    // Fallback responses if AI fails - make them more generic and appropriate
    if (!aiText) {
      console.error('No AI response generated for input:', user_text)
      const fallbackResponses = {
        1: "I hear that's really frustrating for you. Consistency with drop-offs is so important. Can you tell me more about how often this happens and how it affects you and your child?",
        2: "Thank you for sharing that. What emotions come up for you when this happens?",
        3: "What matters most to you in this situation? What values feel at stake?",
        4: "How do you think your co-parent might see this situation?",
        5: "What do you think your child notices when this happens?",
        6: "What are some ways this could work better for everyone?",
        7: "How would you like to communicate this to your co-parent?"
      }
      aiText = fallbackResponses[step_id as keyof typeof fallbackResponses] || "I hear you. Can you tell me more about what's happening?"
    }
    
    // Refinements are now used as context/examples for the AI, not as replacements
    // The AI always generates its own response following the exact phase prompts
    let wasRefined = false // This now means "was influenced by refinements"
    if (refinementContext) {
      wasRefined = true
      console.log('AI response was influenced by refinement examples')
    }
    
    // Skip model improvements lookup if we already have a good response
    // This prevents incorrect pattern matching
    
    // Final text selection (prioritize overrides, then refinements, then AI)
    const finalAiText = override_response || aiText

    // Generate phase summary when step is completed
    let phaseSummary = null
    if (stepComplete && shouldAutoProgress) {
      try {
        // Get all user responses for this completed phase
        const allPhaseResponses = stepHistory?.map(r => r.user_text).join(' ') + ' ' + user_text
        
        // Generate AI summary of what user shared in this phase
        const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: 'You are creating ultra-compact phase summaries for a sidebar. Create a single, concise phrase (5-12 words max) that captures the essence of what the user shared. Be empathetic but extremely brief - like a headline or key insight.'
              },
              {
                role: 'user',
                content: `Phase ${step_id} (${stepConfig.title}): The user shared: "${allPhaseResponses}"\n\nCreate a compact summary phrase (5-12 words max).`
              }
            ],
            temperature: 0.3,
            max_tokens: 25
          }),
        })
        
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json()
          phaseSummary = summaryData.choices?.[0]?.message?.content?.trim()
        }
      } catch (error) {
        console.log('Could not generate phase summary:', error)
      }
    }

    // Store response - wrapped in try-catch to ensure we always return something
    try {
      const insertData = {
        session_id,
        step_id,
        user_text,
        ai_text: finalAiText,
        knowledge_audit: {
          conversation_turn: conversationTurns + 1,
          step_complete: stepComplete,
          guidance_used: stepConfig.goal,
          phase_summary: phaseSummary,
          session_complete: step_id === 7 && stepComplete
        }
      }
      
      await supabase
        .from('responses')
        .insert(insertData)
        
      // If session is complete, mark it in a sessions table or add a flag
      if (step_id === 7 && stepComplete) {
        console.log('Session completed! All 7 phases finished.')
      }
    } catch (dbError) {
      console.error('Database insert error:', dbError)
      // Continue anyway - user experience is more important
    }

    return new Response(
      JSON.stringify({
        ai_text: finalAiText,
        step_complete: stepComplete,
        auto_progress: shouldAutoProgress && !is_refinement, // Don't auto-progress during refinements
        next_step_id: shouldAutoProgress && !is_refinement ? step_id + 1 : null,
        current_step_id: step_id,
        is_refined: !!override_response,
        phase_summary: phaseSummary, // Include the generated summary
        session_complete: step_id === 7 && stepComplete, // Flag when all phases are complete
        knowledge_audit: {
          grounding_sources: override_response ? ['Admin refinement'] : 
                            wasRefined ? ['Database refinement'] : 
                            ['OpenAI GPT-4'],
          policy_checks: ['child_centered', 'empathetic', 'non_judgmental'],
          knowledge_version: '1.0',
          conversation_flow: shouldAutoProgress ? 'auto_progressing' : 'continuing',
          refinement_applied: !!override_response || wasRefined,
          source_type: override_response ? 'refined' : 
                       wasRefined ? 'refined' : 
                       'ai'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: errorMessage,
        hint: errorMessage.includes('OpenAI') ? 'Check OpenAI API key in Edge Function secrets' : 'Check Edge Function logs for details'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})