import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSession } from '@/contexts/SessionContext'
import { supabase } from '@/lib/supabase'
import { ChatMessage } from '@/components/ChatMessage'
import { ProgressTracker } from '@/components/ProgressTracker'
import { ArrowLeft, Send, Settings, Edit3, Save, X, GitCompare, ThumbsUp, ThumbsDown, Tag, FastForward, Code } from 'lucide-react'
import { getWarmWelcome, getStepOnePrompt } from '@/utils/greetings'

interface Message {
  id: string
  type: 'ai' | 'user'
  content: string
  timestamp: Date
  responseId?: string
  category?: string
  source?: 'ai' | 'fallback' | 'refined' | 'knowledge'
  openaiPrompt?: {
    system: string
    user: string
    model: string
    temperature: number
    max_tokens: number
  }
}

type ResponseCategory = 
  | 'direct_answer'
  | 'short_form_response'
  | 'partial_indirect_answer'
  | 'conversational_social'
  | 'meta_app_directed'
  | 'off_topic_non_sequitur'
  | 'refusal_avoidance'
  | 'emotional_expressive'

const stepPrompts = {
  1: "Let's start by naming the issue. What's on your mind?",
  2: "Thank you for sharing that. Now let's explore what you're feeling about this situation. What emotions are coming up for you?",
  3: "I can really hear the emotions in what you've shared. Let's dig deeper - what's truly important to you in this situation? What are your core values here?",
  4: "Your values are clear. Now, let's take a moment to consider your co-parent's perspective. What might they be feeling or needing?",
  5: "That took courage. Now let's focus on your child. What might they be experiencing or needing in this situation?",
  6: "With all these perspectives in mind, let's explore some options that could work for everyone. What possibilities do you see?",
  7: "Great work. Now let's craft a clear, respectful message to move forward. How would you like to communicate this?"
}

export default function StepNew() {
  const { stepId } = useParams()
  const navigate = useNavigate()
  const { sessionId } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [adminMode, setAdminMode] = useState(true) // Default to true for development
  const [isRefining, setIsRefining] = useState<string | null>(null)
  const [refinedText, setRefinedText] = useState('')
  const [chatgptResponse, setChatgptResponse] = useState('')
  const [refinementFeedback, setRefinementFeedback] = useState('')
  const [useChatGPTAsPrimary, setUseChatGPTAsPrimary] = useState(false)
  const [isComparing, setIsComparing] = useState<string | null>(null)
  const [gptResponse, setGptResponse] = useState('')
  const [comparisonNotes, setComparisonNotes] = useState('')
  const [isCategorizing, setIsCategorizing] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ResponseCategory | null>(null)
  const [viewingPrompt, setViewingPrompt] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentStep = Number(stepId)

  useEffect(() => {
    initializeStep()
    loadProgress()
    checkAdminMode()
  }, [stepId])

  const checkAdminMode = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_mode')
        .single()
      
      console.log('Admin mode check:', { data, error })
      
      if (data?.setting_value?.enabled) {
        setAdminMode(true)
        console.log('Admin mode ENABLED')
      } else {
        // Default to true if no setting exists (for development)
        setAdminMode(true)
        console.log('Admin mode ENABLED (default)')
      }
    } catch (err) {
      // If table doesn't exist or error, enable admin mode for development
      console.log('Admin mode ENABLED (fallback)', err)
      setAdminMode(true)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeStep = async () => {
    // Load existing conversation for this step
    const { data: responses } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', sessionId)
      .eq('step_id', currentStep)
      .order('created_at', { ascending: true })

    const existingMessages: Message[] = []
    
    // Add initial AI prompt with warm, varied greeting for Step 1
    let initialPrompt = stepPrompts[currentStep as keyof typeof stepPrompts]
    if (currentStep === 1 && (!responses || responses.length === 0)) {
      // For Step 1, combine warm welcome with step prompt
      initialPrompt = `${getWarmWelcome()}\n\n${getStepOnePrompt()}`
    }
    
    existingMessages.push({
      id: `ai-init-${currentStep}`,
      type: 'ai',
      content: initialPrompt,
      timestamp: new Date()
    })

    // Add existing conversation
    responses?.forEach(response => {
      if (response.user_text) {
        existingMessages.push({
          id: `user-${response.id}`,
          type: 'user',
          content: response.user_text,
          timestamp: new Date(response.created_at)
        })
      }
      if (response.ai_text) {
        existingMessages.push({
          id: `ai-${response.id}`,
          type: 'ai',
          content: response.ai_text,
          timestamp: new Date(response.created_at)
        })
      }
    })

    setMessages(existingMessages)
  }

  const loadProgress = async () => {
    const { data: responses } = await supabase
      .from('responses')
      .select('step_id')
      .eq('session_id', sessionId)
      .order('step_id', { ascending: true })

    const completed = new Set(responses?.map(r => r.step_id) || [])
    setCompletedSteps(Array.from(completed) as number[])
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Get AI response
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/responses-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          step_id: currentStep,
          user_text: userMessage.content,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: data.ai_text,
          timestamp: new Date(),
          responseId: data.response_id,
          source: data.knowledge_audit?.refinement_applied ? 'refined' : 
                  data.knowledge_audit?.grounding_sources?.[0] === 'Admin refinement' ? 'refined' :
                  data.knowledge_audit ? 'knowledge' : 'ai',
          openaiPrompt: data.openai_prompt // Save the OpenAI prompt for admin visibility
        }
        
        setMessages(prev => [...prev, aiMessage])
        
        // Check if AI is auto-progressing to next phase
        if (data.auto_progress && data.next_step_id) {
          // Mark current step as complete
          setCompletedSteps(prev => [...new Set([...prev, currentStep])])
          
          // Update URL to reflect new step but keep conversation flowing
          // The AI response already contains the transition and next prompt
          // so the conversation continues seamlessly
          window.history.pushState({}, '', `/step/${data.next_step_id}`)
          
          // Update local state to reflect new step
          // This is handled by the URL change listener
        } else if (data.step_complete) {
          // Step is complete but not auto-progressing (e.g., step 7)
          setCompletedSteps(prev => [...new Set([...prev, currentStep])])
        }
      } else {
        // Handle error - show a generic empathetic response
        const errorText = await response.text()
        console.error('AI response error:', response.status, errorText)
        const fallbackMessage: Message = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: "I hear you. Let me try to understand better - can you share more about what you're experiencing?",
          timestamp: new Date(),
          source: 'fallback'
        }
        setMessages(prev => [...prev, fallbackMessage])
      }
    } catch (error) {
      console.error('Error getting AI response:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartRefinement = (messageId: string, currentText: string) => {
    setIsRefining(messageId)
    setRefinedText(currentText)
    setChatgptResponse('')
    setRefinementFeedback('')
    setUseChatGPTAsPrimary(false)
  }

  const handleSaveRefinement = async () => {
    if (!isRefining || (!refinedText && !chatgptResponse && !refinementFeedback)) return

    const message = messages.find(m => m.id === isRefining)
    if (!message || message.type !== 'ai') return

    // Find the corresponding user message
    const messageIndex = messages.findIndex(m => m.id === isRefining)
    const userMessage = messages[messageIndex - 1]

    // Determine the best prompt to use
    const bestPrompt = useChatGPTAsPrimary && chatgptResponse 
      ? chatgptResponse 
      : refinedText || chatgptResponse || message.content

    // Save refined response with HIGH confidence for immediate training
    const { error } = await supabase
      .from('refined_responses')
      .insert({
        step_id: currentStep,
        user_text: userMessage?.content || '',
        original_text: message.content,
        refined_text: refinedText,
        chatgpt_response: chatgptResponse,
        use_chatgpt_as_primary: useChatGPTAsPrimary,
        feedback: refinementFeedback,
        is_approved: true,
        confidence: 0.95 // HIGH confidence for admin edits during chat
      })

    if (!error) {
      // IMMEDIATELY update the UI with the refined prompt and mark as refined
      setMessages(prev => prev.map(m => 
        m.id === isRefining 
          ? { ...m, content: bestPrompt, source: 'refined' as const }
          : m
      ))
      
      // Also store for model training
      if (chatgptResponse || refinedText) {
        await supabase
          .from('model_improvements')
          .insert({
            pattern_type: detectPatternType(bestPrompt),
            step_id: currentStep,
            trigger_phrase: userMessage?.content.substring(0, 100),
            current_response: message.content,
            improved_response: bestPrompt,
            improvement_reason: refinementFeedback || 'Admin refinement during chat - HIGH PRIORITY',
            source_type: chatgptResponse ? 'chatgpt' : 'manual',
            chatgpt_pattern: chatgptResponse,
            confidence_score: 0.95, // High confidence for admin live edits
            is_active: true
          })
        
        console.log('✅ Response updated and saved for IMMEDIATE AI training with HIGH confidence')
      }
      
      // Show success notification
      const successMsg = chatgptResponse && useChatGPTAsPrimary 
        ? '✨ ChatGPT response saved and AI trained for future similar inputs!'
        : '✨ Refined response saved and AI trained for future similar inputs!'
      
      // Add a system message to show training success
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        type: 'ai' as const,
        content: successMsg,
        timestamp: new Date(),
        source: 'ai' as const
      }])
      
      setIsRefining(null)
      setRefinedText('')
      setChatgptResponse('')
      setRefinementFeedback('')
      setUseChatGPTAsPrimary(false)
    }
  }

  const handleCancelRefinement = () => {
    setIsRefining(null)
    setRefinedText('')
    setChatgptResponse('')
    setRefinementFeedback('')
    setUseChatGPTAsPrimary(false)
  }

  const handleStartComparison = (messageId: string) => {
    setIsComparing(messageId)
    setGptResponse('')
    setComparisonNotes('')
  }

  const handleSaveComparison = async () => {
    if (!isComparing || !gptResponse) return

    const message = messages.find(m => m.id === isComparing)
    if (!message || message.type !== 'ai') return

    // Find the corresponding user message
    const messageIndex = messages.findIndex(m => m.id === isComparing)
    const userMessage = messages[messageIndex - 1]

    // Analyze differences
    const { data: analysis } = await supabase
      .rpc('analyze_response_difference', {
        app_text: message.content,
        gpt_text: gptResponse
      })

    // Save comparison to database
    const { error } = await supabase
      .from('gpt_reference_responses')
      .insert({
        session_id: sessionId,
        step_id: currentStep,
        user_text: userMessage?.content || '',
        app_response: message.content,
        gpt_response: gptResponse,
        comparison_notes: comparisonNotes,
        key_differences: analysis,
        improvements_needed: extractImprovements(message.content, gptResponse)
      })

    if (!error) {
      // Also create model improvement entry if GPT response is better
      await supabase
        .from('model_improvements')
        .insert({
          pattern_type: detectPatternType(gptResponse),
          step_id: currentStep,
          trigger_phrase: userMessage?.content.substring(0, 100),
          current_response: message.content,
          improved_response: gptResponse,
          improvement_reason: comparisonNotes
        })
      
      setIsComparing(null)
      setGptResponse('')
      setComparisonNotes('')
      alert('Comparison saved! This will help improve future responses.')
    }
  }

  const extractImprovements = (appResponse: string, gptResponse: string): string[] => {
    const improvements = []
    
    // Check for empathy
    const empathyWords = ['understand', 'hear', 'appreciate', 'courage', 'challenging']
    const gptEmpathy = empathyWords.filter(w => gptResponse.toLowerCase().includes(w))
    const appEmpathy = empathyWords.filter(w => appResponse.toLowerCase().includes(w))
    if (gptEmpathy.length > appEmpathy.length) {
      improvements.push('Add more empathetic language')
    }
    
    // Check for questions
    if (gptResponse.includes('?') && !appResponse.includes('?')) {
      improvements.push('Include probing questions')
    }
    
    // Check for transitions
    if (gptResponse.includes('Now') || gptResponse.includes('Let\'s')) {
      improvements.push('Better phase transitions')
    }
    
    return improvements
  }

  const detectPatternType = (response: string): string => {
    if (response.includes('I hear') || response.includes('I understand')) return 'empathy'
    if (response.includes('?')) return 'probing'
    if (response.includes('Now let\'s') || response.includes('Moving forward')) return 'transition'
    return 'general'
  }

  const handleCancelComparison = () => {
    setIsComparing(null)
    setGptResponse('')
    setComparisonNotes('')
  }

  const handleStartCategorizing = (messageId: string) => {
    setIsCategorizing(messageId)
    setSelectedCategory(null)
  }

  const handleSaveCategory = async () => {
    if (!isCategorizing || !selectedCategory) return

    const message = messages.find(m => m.id === isCategorizing)
    if (!message || message.type !== 'user') return

    // Update the response record with category
    const { error } = await supabase
      .from('responses')
      .update({
        user_response_category: selectedCategory,
        categorized_by: 'admin',
        categorized_at: new Date().toISOString(),
        category_confidence: 1.0 // Admin categorization has full confidence
      })
      .eq('session_id', sessionId)
      .eq('step_id', currentStep)
      .eq('user_text', message.content)

    if (!error) {
      // Update message in UI
      setMessages(prev => prev.map(m => 
        m.id === isCategorizing 
          ? { ...m, category: selectedCategory }
          : m
      ))
      
      // Track category pattern
      await supabase
        .from('response_category_patterns')
        .insert({
          step_id: currentStep,
          category: selectedCategory,
          pattern_text: message.content,
          example_responses: [message.content]
        })
      
      setIsCategorizing(null)
      setSelectedCategory(null)
    }
  }

  const handleCancelCategorizing = () => {
    setIsCategorizing(null)
    setSelectedCategory(null)
  }

  const categoryLabels: Record<ResponseCategory, { label: string; color: string; description: string }> = {
    'direct_answer': { 
      label: 'Direct Answer', 
      color: 'bg-green-100 text-green-700',
      description: 'Clear, on-topic response to the prompt'
    },
    'short_form_response': {
      label: 'Short-Form Response',
      color: 'bg-blue-100 text-blue-700',
      description: 'Sufficient but brief response, possibly lazy or terse'
    },
    'partial_indirect_answer': { 
      label: 'Partial/Indirect', 
      color: 'bg-yellow-100 text-yellow-700',
      description: 'Partially addresses the question or indirect response'
    },
    'conversational_social': { 
      label: 'Social/Chitchat', 
      color: 'bg-purple-100 text-purple-700',
      description: 'Greetings, thanks, or social pleasantries'
    },
    'meta_app_directed': { 
      label: 'Meta/App Comment', 
      color: 'bg-purple-100 text-purple-700',
      description: 'Comments about the app or process itself'
    },
    'off_topic_non_sequitur': { 
      label: 'Off-Topic', 
      color: 'bg-gray-100 text-gray-700',
      description: 'Unrelated to the current topic or question'
    },
    'refusal_avoidance': { 
      label: 'Refusal/Avoidance', 
      color: 'bg-red-100 text-red-700',
      description: 'Declining to answer or avoiding the question'
    },
    'emotional_expressive': { 
      label: 'Emotional/Expressive', 
      color: 'bg-pink-100 text-pink-700',
      description: 'Strong emotional expression or reaction'
    }
  }

  const handleProgressPhase = async (messageId: string) => {
    // Find the AI message and the preceding user message
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return
    
    const aiMessage = messages[messageIndex]
    if (aiMessage.type !== 'ai') return
    
    // Find the most recent user message before this AI response
    let userMessage = null
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].type === 'user') {
        userMessage = messages[i]
        break
      }
    }
    
    if (!userMessage) return
    
    // Count conversation turns (pairs of user-AI messages)
    const conversationTurn = messages.filter(m => m.type === 'user').length
    
    // Analyze the user message
    const userWords = userMessage.content.split(/\s+/).length
    const emotionWords = ['feel', 'feeling', 'frustrated', 'angry', 'sad', 'happy', 'worried', 'anxious', 'hurt', 'confused']
    const hasEmotions = emotionWords.some(word => userMessage.content.toLowerCase().includes(word))
    const valueWords = ['important', 'value', 'believe', 'need', 'want', 'matters', 'care']
    const hasValues = valueWords.some(word => userMessage.content.toLowerCase().includes(word))
    const perspectiveWords = ['they', 'their', 'them', 'perspective', 'might think', 'probably']
    const hasPerspective = perspectiveWords.some(word => userMessage.content.toLowerCase().includes(word))
    
    // Save the feedback
    const { error: feedbackError } = await supabase
      .from('phase_progression_feedback')
      .insert({
        session_id: sessionId,
        step_id: currentStep,
        response_id: aiMessage.responseId || null,
        user_message: userMessage.content,
        ai_response: aiMessage.content,
        conversation_turn: conversationTurn,
        should_have_progressed: true,
        admin_notes: 'Admin indicated phase should progress',
        user_word_count: userWords,
        had_emotions: hasEmotions,
        had_values: hasValues,
        had_perspective: hasPerspective,
        message_category: userMessage.category || null
      })
    
    if (feedbackError) {
      console.error('Error saving progression feedback:', feedbackError)
    }
    
    // Update the learned patterns
    const { data: pattern } = await supabase
      .from('phase_progression_patterns')
      .select('*')
      .eq('step_id', currentStep)
      .single()
    
    if (pattern) {
      // Update pattern based on feedback
      const updates: any = {
        feedback_count: pattern.feedback_count + 1,
        confidence_score: Math.min(1.0, pattern.confidence_score + 0.05),
        updated_at: new Date().toISOString()
      }
      
      // Adjust criteria based on this example
      if (conversationTurn < (pattern.min_conversation_turns || 99)) {
        updates.min_conversation_turns = conversationTurn
      }
      
      if (userWords < (pattern.min_word_count || 99)) {
        updates.min_word_count = userWords
      }
      
      await supabase
        .from('phase_progression_patterns')
        .update(updates)
        .eq('id', pattern.id)
    }
    
    // Actually progress to the next phase
    handleNext()
  }

  const handleNext = () => {
    if (currentStep < 7) {
      navigate(`/step/${currentStep + 1}`)
    } else {
      navigate('/complete')
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      navigate(`/step/${currentStep - 1}`)
    } else {
      navigate('/start')
    }
  }

  const stepTitles = {
    1: "Let's Name It",
    2: "What's Beneath That?",
    3: "Your Why",
    4: "Step Into Your Co-Parent's Shoes",
    5: "See Through Your Child's Eyes",
    6: "Explore Aligned Options",
    7: "Choose + Communicate"
  }

  // Debug logging
  console.log('Admin button visibility check:', {
    adminMode,
    currentStep,
    userMessageCount: messages.filter(m => m.type === 'user').length,
    shouldShowButton: adminMode && currentStep < 7 && messages.filter(m => m.type === 'user').length > 0
  })

  return (
    <>
      {/* Admin Bar - Always at Top */}
      {adminMode && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-black px-4 py-2 z-[10000] flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="font-bold">🎓 ADMIN MODE</span>
            <span className="text-sm">Step {currentStep}/7</span>
          </div>
          {currentStep < 7 && (
            <button
              onClick={() => {
                if (confirm(`Skip to Step ${currentStep + 1} and train AI?`)) {
                  const lastAiMessage = [...messages].reverse().find(m => m.type === 'ai')
                  if (lastAiMessage) {
                    handleProgressPhase(lastAiMessage.id)
                  } else {
                    handleNext()
                  }
                }
              }}
              className="px-4 py-1 bg-green-700 text-white rounded-lg font-bold hover:bg-green-800"
            >
              ⏩ SKIP TO STEP {currentStep + 1}
            </button>
          )}
        </div>
      )}
      
      <div className={`min-h-screen bg-gray-50 flex ${adminMode ? 'pt-12' : ''}`}>
      {/* Floating Admin Progress Button - ALWAYS VISIBLE IN ADMIN MODE */}
      {adminMode && currentStep < 7 && (
        <div className="fixed bottom-20 right-4 z-[9999]" style={{ zIndex: 9999 }}>
          <button
            onClick={() => {
              const lastAiMessage = [...messages].reverse().find(m => m.type === 'ai')
              if (confirm(`Progress to Step ${currentStep + 1}?\n\nUse this when the AI asked an unnecessary follow-up question. The system will learn to progress faster next time.`)) {
                if (lastAiMessage) {
                  handleProgressPhase(lastAiMessage.id)
                } else {
                  // If no AI message yet, just navigate
                  handleNext()
                }
              }
            }}
            className="group flex items-center gap-2 px-6 py-4 bg-green-600 text-white rounded-full shadow-2xl hover:bg-green-700 hover:shadow-xl transition-all hover:scale-110 text-lg font-semibold"
            title="Progress to next step and train AI"
          >
            <FastForward className="w-6 h-6" />
            <span>Skip to Step {currentStep + 1}</span>
          </button>
          <div className="mt-2 p-3 bg-yellow-100 border-2 border-yellow-300 rounded-lg shadow-lg text-sm max-w-xs">
            <p className="text-yellow-900 font-bold mb-1">🎓 Admin Training Mode</p>
            <p className="text-yellow-800">
              Click to progress when AI asks unnecessary follow-ups
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  BeAligned™ Reflection
                </h1>
                <p className="text-sm text-gray-600">
                  Phase {currentStep} of 7
                </p>
              </div>
            </div>
            {adminMode && (
              <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Admin Mode</span>
              </div>
            )}
          </div>
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-2">
            {messages.map(message => {
              const isBeingRefined = isRefining === message.id
              const isBeingCompared = isComparing === message.id
              const isBeingCategorized = isCategorizing === message.id
              const isViewingPrompt = viewingPrompt === message.id
              
              return (
                <div key={message.id} className="relative">
                  {isBeingRefined ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="mb-3">
                        <label className="text-sm font-medium text-gray-700 block mb-2">
                          Refine AI Prompt
                        </label>
                        <textarea
                          value={refinedText}
                          onChange={(e) => setRefinedText(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                          rows={3}
                          placeholder="Edit the AI prompt or leave blank to use ChatGPT version"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="text-sm font-medium text-green-700 block mb-2">
                          ChatGPT Prompt (Trina's GPT)
                        </label>
                        <textarea
                          value={chatgptResponse}
                          onChange={(e) => setChatgptResponse(e.target.value)}
                          className="w-full px-3 py-2 border border-green-300 bg-green-50 rounded-lg text-sm resize-none"
                          rows={3}
                          placeholder="Paste Trina's ChatGPT prompt here for the app to learn from..."
                        />
                      </div>
                      {chatgptResponse && (
                        <div className="mb-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={useChatGPTAsPrimary}
                              onChange={(e) => setUseChatGPTAsPrimary(e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-green-700 font-medium">
                              Use ChatGPT prompt as primary
                            </span>
                          </label>
                        </div>
                      )}
                      <div className="mb-3">
                        <label className="text-sm font-medium text-gray-700 block mb-2">
                          Refinement Notes (optional)
                        </label>
                        <input
                          type="text"
                          value={refinementFeedback}
                          onChange={(e) => setRefinementFeedback(e.target.value)}
                          placeholder="What makes this prompt better?"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveRefinement}
                          disabled={!refinedText && !chatgptResponse}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="w-3 h-3" />
                          Save & Train Model
                        </button>
                        <button
                          onClick={handleCancelRefinement}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        💡 This will be used for similar responses in future sessions
                      </p>
                    </div>
                  ) : isBeingCompared ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">
                            App Prompt
                          </label>
                          <div className="bg-white p-3 rounded border text-sm">
                            {message.content}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">
                            Reference GPT Prompt
                          </label>
                          <textarea
                            value={gptResponse}
                            onChange={(e) => setGptResponse(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                            rows={3}
                            placeholder="Paste the GPT prompt here..."
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Comparison Notes
                        </label>
                        <input
                          type="text"
                          value={comparisonNotes}
                          onChange={(e) => setComparisonNotes(e.target.value)}
                          placeholder="What's better about the GPT prompt?"
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveComparison}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                        >
                          <Save className="w-3 h-3" />
                          Save Comparison
                        </button>
                        <button
                          onClick={handleCancelComparison}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : isBeingCategorized ? (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">User Response:</p>
                        <div className="bg-white p-3 rounded border text-sm">
                          {message.content}
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="text-sm font-medium text-purple-700 block mb-2">
                          Select Response Category
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(categoryLabels).map(([key, info]) => (
                            <button
                              key={key}
                              onClick={() => setSelectedCategory(key as ResponseCategory)}
                              className={`p-2 rounded-lg border text-xs transition-all ${
                                selectedCategory === key
                                  ? `${info.color} border-current font-medium`
                                  : 'bg-white hover:bg-gray-50 border-gray-200'
                              }`}
                              title={info.description}
                            >
                              {info.label}
                            </button>
                          ))}
                        </div>
                        {selectedCategory && (
                          <p className="text-xs text-gray-600 mt-2">
                            {categoryLabels[selectedCategory].description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveCategory}
                          disabled={!selectedCategory}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="w-3 h-3" />
                          Save Category
                        </button>
                        <button
                          onClick={handleCancelCategorizing}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative">
                      <ChatMessage
                        type={message.type}
                        content={message.content}
                        timestamp={message.timestamp}
                        responseId={message.responseId}
                        sessionId={sessionId}
                        stepId={currentStep}
                        showFeedback={adminMode && message.type === 'ai'}
                      />
                      {/* Source indicator for AI responses in admin mode */}
                      {adminMode && message.type === 'ai' && message.source && (
                        <div className="ml-11 mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                            message.source === 'fallback' ? 'bg-red-100 text-red-700' :
                            message.source === 'refined' ? 'bg-green-100 text-green-700' :
                            message.source === 'knowledge' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {message.source === 'fallback' ? '⚠️ Fallback' :
                             message.source === 'refined' ? '✨ Refined' :
                             message.source === 'knowledge' ? '📚 Knowledge' :
                             '🤖 AI Generated'}
                          </span>
                        </div>
                      )}
                      {/* Category badge for categorized user messages */}
                      {message.type === 'user' && message.category && (
                        <div className="ml-11 mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${categoryLabels[message.category as ResponseCategory]?.color || 'bg-gray-100'}`}>
                            <Tag className="w-3 h-3" />
                            {categoryLabels[message.category as ResponseCategory]?.label}
                          </span>
                        </div>
                      )}
                      {/* Admin buttons */}
                      {adminMode && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {message.type === 'ai' && (
                            <>
                              <button
                                onClick={() => handleStartRefinement(message.id, message.content)}
                                className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md border"
                                title="Refine this response"
                              >
                                <Edit3 className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => handleStartComparison(message.id)}
                                className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md border"
                                title="Compare with GPT"
                              >
                                <GitCompare className="w-4 h-4 text-blue-600" />
                              </button>
                              {currentStep < 7 && (
                                <button
                                  onClick={() => {
                                    if (confirm('Mark that the phase should have progressed here?')) {
                                      handleProgressPhase(message.id)
                                    }
                                  }}
                                  className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md border"
                                  title="Phase should progress here"
                                >
                                  <FastForward className="w-4 h-4 text-green-600" />
                                </button>
                              )}
                              {message.openaiPrompt && (
                                <button
                                  onClick={() => setViewingPrompt(viewingPrompt === message.id ? null : message.id)}
                                  className={`p-2 bg-white rounded-lg shadow-sm hover:shadow-md border ${viewingPrompt === message.id ? 'bg-blue-50 border-blue-300' : ''}`}
                                  title="View OpenAI prompt"
                                >
                                  <Code className="w-4 h-4 text-blue-600" />
                                </button>
                              )}
                            </>
                          )}
                          {message.type === 'user' && (
                            <button
                              onClick={() => handleStartCategorizing(message.id)}
                              className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md border"
                              title="Categorize this response"
                            >
                              <Tag className="w-4 h-4 text-purple-600" />
                            </button>
                          )}
                        </div>
                      )}
                      {/* OpenAI Prompt Display (Admin Only) */}
                      {isViewingPrompt && message.openaiPrompt && adminMode && (
                        <div className="ml-11 mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-blue-900">OpenAI API Prompt</h4>
                            <button
                              onClick={() => setViewingPrompt(null)}
                              className="p-1 hover:bg-blue-100 rounded"
                            >
                              <X className="w-4 h-4 text-blue-600" />
                            </button>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-medium text-blue-700 mb-1">Model Settings:</p>
                              <div className="bg-white p-2 rounded text-xs font-mono">
                                Model: {message.openaiPrompt.model}<br/>
                                Temperature: {message.openaiPrompt.temperature}<br/>
                                Max Tokens: {message.openaiPrompt.max_tokens}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-xs font-medium text-blue-700 mb-1">System Prompt:</p>
                              <div className="bg-white p-3 rounded max-h-48 overflow-y-auto">
                                <pre className="text-xs whitespace-pre-wrap font-mono text-gray-700">
                                  {message.openaiPrompt.system}
                                </pre>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-xs font-medium text-blue-700 mb-1">User Prompt:</p>
                              <div className="bg-white p-3 rounded max-h-48 overflow-y-auto">
                                <pre className="text-xs whitespace-pre-wrap font-mono text-gray-700">
                                  {message.openaiPrompt.user}
                                </pre>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    `SYSTEM:\n${message.openaiPrompt.system}\n\nUSER:\n${message.openaiPrompt.user}`
                                  )
                                  alert('Prompt copied to clipboard!')
                                }}
                                className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Copy Full Prompt
                              </button>
                              <button
                                onClick={() => {
                                  const promptData = JSON.stringify(message.openaiPrompt, null, 2)
                                  navigator.clipboard.writeText(promptData)
                                  alert('JSON copied to clipboard!')
                                }}
                                className="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                              >
                                Copy as JSON
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {loading && (
              <div className="flex gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center">
                  <span className="text-white text-sm">BA</span>
                </div>
                <div className="bg-gray-50 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t bg-white px-6 py-4">
          {/* Admin controls */}
          {adminMode && currentStep < 7 && messages.length > 0 && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-yellow-900">Admin Controls:</span>
                  <span className="text-xs text-yellow-700">Step {currentStep} of 7</span>
                  <span className="text-xs text-yellow-600">
                    | {messages.filter(m => m.type === 'user').length} user responses
                  </span>
                </div>
                <button
                  onClick={() => {
                    const lastAiMessage = [...messages].reverse().find(m => m.type === 'ai')
                    if (lastAiMessage && confirm('Mark that the phase should progress to Step ' + (currentStep + 1) + '?')) {
                      handleProgressPhase(lastAiMessage.id)
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                  title="Progress to next phase"
                >
                  <FastForward className="w-4 h-4" />
                  Progress to Step {currentStep + 1}
                </button>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-yellow-700">
                  Use this when the AI should have auto-progressed but didn't. The system will learn from this feedback.
                </p>
                {messages.filter(m => m.type === 'user').length > 0 && (
                  <p className="text-xs text-yellow-600">
                    Last user message: {(() => {
                      const lastUserMsg = [...messages].reverse().find(m => m.type === 'user')
                      return lastUserMsg ? 
                        `"${lastUserMsg.content.substring(0, 50)}${lastUserMsg.content.length > 50 ? '...' : ''}" (${lastUserMsg.content.split(/\s+/).length} words)` 
                        : 'None'
                    })()}
                  </p>
                )}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message here..."
              className="flex-1 px-4 py-3 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* Only show completion button for final step */}
          {completedSteps.includes(7) && currentStep === 7 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 mb-3">
                You've completed your reflection journey! 
              </p>
              <button
                onClick={() => navigate('/complete')}
                className="w-full btn btn-success py-3"
              >
                Complete Reflection
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-gray-100 p-6 border-l hidden lg:block">
        <ProgressTracker
          currentStep={currentStep}
          completedSteps={completedSteps}
        />
      </div>
    </div>
    </>
  )
}