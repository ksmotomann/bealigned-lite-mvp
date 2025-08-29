import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// BeAligned™ Beta Lite system prompt from BABL Revised Operating Instructions
const systemPrompt = `You are BeAligned™ Beta Lite — a warm, grounded, nonjudgmental reflection companion built to support one co-parent in thinking through a current challenge. Your goal is to guide the user through a 7-phase reflective process rooted in the BeH2O® communication framework and BeAligned™ mindset. You help the user uncover their deeper purpose ("why"), consider the perspectives of others, and move toward aligned, child-centered communication.

You are NOT a therapist, mediator, or legal advisor. You do not make decisions or take sides. You speak like a caring friend who deeply understands, not a clinical professional. Your job is to invite clarity, calm, and compassion — step by step.

CRITICAL: NEVER use the phrase "Oh, friend" or "Oh friend" - it sounds artificial and patronizing. Be genuine and grounded.

CONVERSATIONAL APPROACH:
- RECOGNIZE HEAVY SHARES: When someone shares addiction, abuse, serious illness, or deep pain, respond with genuine compassion
- For ADDICTION specifically: "Addiction in a co-parenting relationship brings so much unpredictability and fear. The constant worry about your children's safety, trying to maintain stability when everything feels chaotic... This is an enormous challenge you're navigating."
- For serious issues, take 3-4 sentences to acknowledge the complexity and difficulty
- VARY YOUR RESPONSES: Use specific, authentic acknowledgments that reference what they've actually shared
- Match the emotional weight: Light issues get warm responses, heavy issues get deeper acknowledgment
- Natural language examples: "That sounds incredibly difficult" / "What a complex situation to navigate" / "The challenges you're describing are real and significant" / "This situation clearly weighs heavily on you"
- Use the EXACT BeAligned prompts provided including phase numbers and titles
- Stay present with their specific situation - reference their actual words
- For Step 2 specifically after heavy shares: Really honor their courage in naming the issue before exploring feelings
- SYNTHESIZE themes from across phases - connect current insights to earlier emotions and values
- When transitioning phases, offer brief reflective summaries that help users see connections
- Validate the depth and significance of what's been shared 
- For typical shares: 2-3 sentences before the prompt (BeH2O CLEAR principles)
- For HEAVY shares (addiction, abuse, loss): 3-5 sentences of genuine acknowledgment before the prompt
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
    initialPrompt: "If your co-parent were describing this situation, how might they see it?",
    probes: [
      "Even if you don't agree, what do you imagine they're feeling or needing?",
      "What might be driving their reaction? What do they care about, in their own way?",
      "What needs might they be trying to meet?"
    ],
    guidance: "CRITICAL: Ask about the CO-PARENT'S PERSPECTIVE, not the user's hopes. Help them consider how their co-parent sees the situation.",
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
    
    // Intelligent response interpretation
    const userWords = user_text.split(' ').length
    const userSentences = user_text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    
    // Build cumulative context from all responses in this step
    const allStepText = stepHistory?.map(r => r.user_text).join(' ') || ''
    const cumulativeWords = allStepText.split(' ').length + userWords
    
    // Interpret response type based on CONTEXT, not keywords
    // Step 1: Have they described a situation?
    const step1Complete = step_id === 1 && (
      userWords >= 5 || // They've given at least a brief description
      conversationTurns >= 1 // Any prior response in this step
    )
    
    // Step 2: Have they expressed feelings about it?
    const step2Complete = step_id === 2 && (
      userWords >= 3 || // Even "fear and uncertainty" is enough
      conversationTurns >= 1 // Any prior response in this step
    )
    
    // Step 3: Have they touched on their values/why?
    const step3Complete = step_id === 3 && (
      userWords >= 5 || // Basic expression of values
      conversationTurns >= 1 // Any prior response in this step
    )
    
    // Step 4: Have they considered co-parent's perspective?
    const step4Complete = step_id === 4 && (
      userWords >= 3 || // Even brief perspective is OK
      conversationTurns >= 1 // Any prior response in this step
    )
    
    // Step 5: Have they considered child's perspective?
    const step5Complete = step_id === 5 && (
      userWords >= 3 || // Brief child perspective
      conversationTurns >= 1 // Any prior response in this step
    )
    
    // Step 6: Have they engaged with options?
    const step6Complete = step_id === 6 && conversationTurns >= 0 // Any response
    
    // Step 7: Have they crafted a message?
    const step7Complete = step_id === 7 && conversationTurns >= 0 // Any response
    
    // Check for explicit progression signals
    const userSignalsCompletion = /\b(that's it|thats it|that's all|thats all|done|finished|next|ready)\b/i.test(user_text) ||
      /^(yes|yeah|ok|okay|sure)\s*\.?$/i.test(user_text.trim())
    
    // Determine if response needs more depth
    const responseIsMinimal = userWords <= 2 && conversationTurns === 0
    const responseIsVague = userWords < 5 && !userSignalsCompletion && conversationTurns === 0
    
    // Check learned patterns from admin feedback
    let learnedPattern = null
    try {
      const { data: pattern } = await supabase
        .from('phase_progression_patterns')
        .select('*')
        .eq('step_id', step_id)
        .single()
      
      if (pattern && pattern.confidence_score > 0.6) {
        learnedPattern = pattern
      }
    } catch (error) {
      console.log('Could not load learned patterns:', error)
    }
    
    // Determine phase completion based on step and response interpretation
    const stepCompletionMap = {
      1: step1Complete,
      2: step2Complete,
      3: step3Complete,
      4: step4Complete,
      5: step5Complete,
      6: step6Complete,
      7: step7Complete
    }
    
    const stepComplete = stepCompletionMap[step_id as keyof typeof stepCompletionMap] || false
    
    // Override with learned patterns if available
    const meetsLearnedRequirements = learnedPattern ? 
      conversationTurns >= (learnedPattern.min_conversation_turns || 1) : false
    
    // Final decision: progress if step is complete OR user explicitly wants to
    const shouldAutoProgress = (stepComplete || userSignalsCompletion || meetsLearnedRequirements) && step_id < 7
    const needsMoreDepth = responseIsVague && !shouldAutoProgress
    
    // Get next step info if progressing
    const nextStepConfig = shouldAutoProgress ? stepGuidance[(step_id + 1) as keyof typeof stepGuidance] : null
    
    // Debug logging for phase progression
    console.log('Phase analysis:', {
      step: step_id,
      input: user_text.substring(0, 50) + '...',
      words: userWords,
      turns: conversationTurns,
      stepComplete,
      userSignalsCompletion,
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

    // Get refinement examples to guide the AI - prioritize HIGH confidence admin edits
    let refinementContext = ''
    try {
      // First check for recent high-confidence admin refinements
      const { data: adminRefinement } = await supabase
        .from('refined_responses')
        .select('*')
        .eq('step_id', step_id)
        .eq('is_approved', true)
        .gte('confidence', 0.9) // High confidence admin edits
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (adminRefinement && (adminRefinement.use_chatgpt_as_primary || adminRefinement.refined_text)) {
        const adminExample = adminRefinement.use_chatgpt_as_primary 
          ? adminRefinement.chatgpt_response 
          : adminRefinement.refined_text
        
        refinementContext = `\n\nIMPORTANT - Admin-approved response pattern (USE THIS STYLE):\n"${adminExample}"\n${adminRefinement.feedback ? `Guidance: ${adminRefinement.feedback}` : ''}\nMatch this tone and approach closely.`
      } else {
        // Fall back to RPC for general refinements
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
      }
    } catch (error) {
      // Refinements are optional - don't break if unavailable
      console.log('Could not load refinements:', error)
    }

    // Build the complete OpenAI prompt for admin visibility
    const systemMessage = `${systemPrompt}\n\nCurrent step ${step_id}: ${stepConfig.goal}\nGuidance: ${stepConfig.guidance}\n\nPrevious context:\n${previousContext || 'None'}${refinementContext}`
    
    const userMessage = `Step history:\n${currentStepHistory || 'None'}\n\nLatest response: "${user_text}"\n\n${
              step_id === 7 && stepComplete
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
                : `INTELLIGENT RESPONSE - Interpret and decide next action.

User's response: "${user_text}"
Words in response: ${userWords}
Conversation turns so far: ${conversationTurns}
Current step: ${step_id}

DECISION FRAMEWORK - YOU MUST FOLLOW THIS EXACTLY:

Step ${step_id} - User said: "${user_text}" (${userWords} words)
Previous turns in this step: ${conversationTurns}

PROGRESSION RULES:
- Step 1: Progress if 5+ words OR any second response
- Step 2: Progress if 3+ words (feelings) OR any second response  
- Step 3: Progress if 5+ words (values) OR any second response - "to ensure my sons..." COUNTS
- Step 4: Progress if 3+ words (perspective) OR any second response
- Step 5-7: Progress after any response

Current Step 3 example: "to ensure my sons are afforded the most supportive parenting dynamic" = 10 words = PROGRESS TO STEP 4

${stepConfig.guidance}

MANDATORY ACTION:
${userWords >= (step_id === 2 || step_id === 4 || step_id === 5 ? 3 : 5) || conversationTurns >= 1 
  ? `PROGRESS TO NEXT PHASE - Use this EXACT format:
[Acknowledge their response briefly]

---

**${(step_id + 1)}. ${step_id < 7 ? stepGuidance[(step_id + 1) as keyof typeof stepGuidance]?.title || '' : ''}**
**${step_id < 7 ? stepGuidance[(step_id + 1) as keyof typeof stepGuidance]?.initialPrompt || '' : ''}**`
  : `PROBE FOR MORE - Use: **${stepConfig.probes[Math.min(conversationTurns, stepConfig.probes.length - 1)]}**`}`
            }\n\nCRITICAL INSTRUCTIONS:
1. NEVER USE "Oh, friend" or "Oh friend" or any variation - it's patronizing and artificial
2. MATCH THE EMOTIONAL WEIGHT: Light shares = 2-3 sentences. Heavy shares (addiction/abuse/trauma) = 3-5 sentences of acknowledgment
3. For addiction: "Dealing with addiction in your co-parenting relationship brings such uncertainty and fear. Protecting your children while managing this situation - it's one of the most difficult challenges a parent can face."
4. ALWAYS use the EXACT prompt text provided above in bold - DO NOT paraphrase or create your own questions
5. For Step 4 specifically: You MUST ask about the co-parent's perspective using the exact prompt provided
6. Be genuine and specific - reference what they actually shared
7. Use authentic, grounded language: "This sounds incredibly challenging" / "What you're navigating is truly difficult" / "The weight of this situation is clear"
8. FORBIDDEN PHRASES: "Oh, friend" / "Oh my heart" / "Oh dear" - Be warm but professional`
    
    // Call OpenAI with the constructed messages
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
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
    // Removed old debug log
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
        },
        // Include OpenAI prompt for admin visibility
        openai_prompt: {
          system: systemMessage,
          user: userMessage,
          model: 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: step_id === 7 && stepComplete ? 400 : 250
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