import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/contexts/SessionContext'
import { supabase } from '@/lib/supabase'
import { ChatMessage } from '@/components/ChatMessage'
import { ArrowLeft, Send, Settings, Edit3, Save, X, Tag, Copy, Download, Star } from 'lucide-react'
import { getTimeBasedGreeting } from '@/utils/greetings'

interface Message {
  id: string
  type: 'ai' | 'user'
  content: string
  timestamp: Date
  responseId?: string
  category?: string
  source?: 'ai' | 'fallback' | 'refined' | 'knowledge'
  stepId?: number
  errorDetails?: string
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

export default function Reflection() {
  const navigate = useNavigate()
  const { sessionId } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showThinking, setShowThinking] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [phaseSummaries, setPhaseSummaries] = useState<Record<number, string>>({})
  const [sessionComplete, setSessionComplete] = useState(false)
  const [finalMessage, setFinalMessage] = useState<string>('')
  const [adminMode, setAdminMode] = useState(false)
  const [isRefining, setIsRefining] = useState<string | null>(null)
  const [refinedText, setRefinedText] = useState('')
  const [chatgptResponse, setChatgptResponse] = useState('')
  const [refinementFeedback, setRefinementFeedback] = useState('')
  const [useChatGPTAsPrimary, setUseChatGPTAsPrimary] = useState(false)
  const [isCategorizing, setIsCategorizing] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ResponseCategory | null>(null)
  const [showingErrorDetails, setShowingErrorDetails] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [rating, setRating] = useState<number>(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    initializeConversation()
    checkAdminMode()
  }, [])

  const checkAdminMode = async () => {
    const { data } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'admin_mode')
      .single()
    
    if (data?.setting_value?.enabled) {
      setAdminMode(true)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Re-focus input when loading completes
  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus()
    }
  }, [loading])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeConversation = async () => {
    // Load existing conversation
    const { data: responses } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    const existingMessages: Message[] = []
    let highestStep = 1
    
    if (responses && responses.length > 0) {
      const summaries: Record<number, string> = {}
      
      // Rebuild conversation from history
      responses.forEach(response => {
        // Add user message
        existingMessages.push({
          id: `user-${response.id}`,
          type: 'user',
          content: response.user_text,
          timestamp: new Date(response.created_at),
          stepId: response.step_id
        })
        
        // Add AI response
        existingMessages.push({
          id: `ai-${response.id}`,
          type: 'ai',
          content: response.ai_text,
          timestamp: new Date(response.created_at),
          responseId: response.id,
          stepId: response.step_id,
          source: response.knowledge_audit?.refinement_applied ? 'refined' : 
                  response.knowledge_audit?.grounding_sources?.[0] === 'Admin refinement' ? 'refined' :
                  response.knowledge_audit ? 'knowledge' : 'ai'
        })
        
        // Extract phase summary if available
        if (response.knowledge_audit?.phase_summary) {
          summaries[response.step_id] = response.knowledge_audit.phase_summary
        }
        
        highestStep = Math.max(highestStep, response.step_id)
      })
      
      setCurrentStep(highestStep)
      setCompletedSteps(Array.from(new Set(responses.map(r => r.step_id))))
      setPhaseSummaries(summaries)
    } else {
      // Start with greeting and first prompt
      const greeting = getTimeBasedGreeting()
      existingMessages.push({
        id: 'ai-greeting',
        type: 'ai',
        content: `${greeting} I'm here to help you work through co-parenting challenges with empathy and wisdom. ${stepPrompts[1]}`,
        timestamp: new Date(),
        stepId: 1
      })
    }
    
    setMessages(existingMessages)
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: input,
      timestamp: new Date(),
      stepId: currentStep
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    
    // Keep focus on input after sending
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)

    try {
      // Check if environment variables are set
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.error('Missing environment variables:', {
          url: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
          key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
        })
        throw new Error('Missing required environment variables. Please check your .env configuration.')
      }
      
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

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Edge Function error:', response.status, errorText)
        throw new Error(`Failed to fetch: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      
      // Check if AI response contains a phase transition (has --- separator)
        const hasPhaseTransition = data.ai_text.includes('---') && (data.auto_progress && !data.session_complete)
        
        if (hasPhaseTransition) {
          // Split into two messages: synthesis + new phase prompt
          const parts = data.ai_text.split('---')
          
          // First message: synthesis/transition
          const synthesisMessage: Message = {
            id: `ai-synthesis-${Date.now()}`,
            type: 'ai',
            content: parts[0].trim(),
            timestamp: new Date(),
            responseId: data.response_id,
            stepId: data.current_step_id || currentStep,
            source: data.knowledge_audit?.source_type || 'ai'
          }
          
          // Add synthesis message immediately
          setMessages(prev => [...prev, synthesisMessage])
          
          // Show "thinking" indicator
          setShowThinking(true)
          
          // Add delay for natural pacing (1.5-2 seconds)
          setTimeout(() => {
            // Second message: new phase prompt  
            const promptMessage: Message = {
              id: `ai-prompt-${Date.now()}`,
              type: 'ai',
              content: parts.slice(1).join('---').trim(),
              timestamp: new Date(),
              responseId: data.response_id,
              stepId: data.next_step_id || currentStep + 1,
              source: data.knowledge_audit?.source_type || 'ai'
            }
            
            setMessages(prev => [...prev, promptMessage])
            setShowThinking(false)
            
            // Scroll to bottom after second message
            setTimeout(() => scrollToBottom(), 100)
          }, 800) // Faster 0.8 second delay for better flow
        } else {
          // Single message as before
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            type: 'ai',
            content: data.ai_text,
            timestamp: new Date(),
            responseId: data.response_id,
            stepId: data.current_step_id || currentStep,
            source: data.knowledge_audit?.source_type || 'ai'
          }
          
          setMessages(prev => [...prev, aiMessage])
        }
        
        // Check if session is complete (all 7 phases finished)
        if (data.session_complete) {
          setSessionComplete(true)
          setCompletedSteps(prev => [...new Set([...prev, currentStep])])
          setFinalMessage(data.ai_text)
          // Store phase summary if provided
          if (data.phase_summary) {
            setPhaseSummaries(prev => ({...prev, [currentStep]: data.phase_summary}))
          }
        }
        // Check if AI is auto-progressing to next phase
        else if (data.auto_progress && data.next_step_id) {
          setCompletedSteps(prev => [...new Set([...prev, currentStep])])
          // Store phase summary if provided
          if (data.phase_summary) {
            setPhaseSummaries(prev => ({...prev, [currentStep]: data.phase_summary}))
          }
          setCurrentStep(data.next_step_id)
        } else if (data.step_complete) {
          setCompletedSteps(prev => [...new Set([...prev, currentStep])])
          // Store phase summary if provided
          if (data.phase_summary) {
            setPhaseSummaries(prev => ({...prev, [currentStep]: data.phase_summary}))
          }
        }
    } catch (error) {
      console.error('Error getting AI response:', error)
      const fallbackMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: "I hear you. Let me try to understand better - can you share more about what you're experiencing?",
        timestamp: new Date(),
        source: 'fallback',
        stepId: currentStep,
        errorDetails: `Network error: ${error instanceof Error ? error.message : 'Failed to connect to AI service'}. Check console for details.`
      }
      setMessages(prev => [...prev, fallbackMessage])
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

    const messageIndex = messages.findIndex(m => m.id === isRefining)
    const userMessage = messages[messageIndex - 1]

    // Determine which prompt to use - prioritize ChatGPT if provided
    const bestPrompt = chatgptResponse || refinedText || message.content

    // Save refinement
    const { error } = await supabase
      .from('refined_responses')
      .insert({
        step_id: message.stepId || currentStep,
        user_text: userMessage?.content || '',
        original_text: message.content,
        refined_text: refinedText,
        chatgpt_response: chatgptResponse,
        use_chatgpt_as_primary: useChatGPTAsPrimary,
        feedback: refinementFeedback,
        is_approved: true
      })

    if (!error) {
      // Update message immediately with the best prompt
      setMessages(prev => prev.map(m => 
        m.id === isRefining 
          ? { ...m, content: bestPrompt, source: 'refined' as const }
          : m
      ))
      
      console.log('✅ Message updated with refined text:', bestPrompt)
      
      setIsRefining(null)
      setRefinedText('')
      setChatgptResponse('')
      setRefinementFeedback('')
      setUseChatGPTAsPrimary(false)
    } else {
      console.error('Failed to save refinement:', error)
    }
  }

  const handleCancelRefinement = () => {
    setIsRefining(null)
    setRefinedText('')
    setChatgptResponse('')
    setRefinementFeedback('')
    setUseChatGPTAsPrimary(false)
  }

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(finalMessage)
      // Could add a toast notification here
      console.log('Message copied to clipboard')
    } catch (err) {
      console.error('Failed to copy message:', err)
    }
  }

  const handleDownloadMessage = () => {
    const element = document.createElement('a')
    const file = new Blob([finalMessage], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `bealigned-reflection-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleSubmitFeedback = async () => {
    try {
      await supabase
        .from('session_feedback')
        .insert({
          session_id: sessionId,
          rating,
          feedback,
          created_at: new Date().toISOString()
        })
      
      setShowFeedback(false)
      setFeedback('')
      setRating(0)
      console.log('Feedback submitted successfully')
    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  const handleStartCategorizing = (messageId: string) => {
    setIsCategorizing(messageId)
    setSelectedCategory(null)
  }

  const handleSaveCategorization = async () => {
    if (!isCategorizing || !selectedCategory) return

    const message = messages.find(m => m.id === isCategorizing)
    if (!message || message.type !== 'user') return

    // Update message with category
    setMessages(prev => prev.map(m => 
      m.id === isCategorizing 
        ? { ...m, category: selectedCategory }
        : m
    ))

    // Save to database
    await supabase
      .from('responses')
      .update({ 
        user_response_category: selectedCategory,
        category_confidence: 0.9,
        categorized_by: 'admin',
        categorized_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('user_text', message.content)

    setIsCategorizing(null)
    setSelectedCategory(null)
  }

  const categoryLabels = {
    'direct_answer': { 
      label: 'Direct Answer', 
      color: 'bg-green-100 text-green-700',
      description: 'Clear, complete response to the question'
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

  const stepTitles = {
    1: "LET'S NAME IT",
    2: "WHAT'S BENEATH THAT?",
    3: "YOUR WHY",
    4: "STEP INTO YOUR CO-PARENT'S SHOES",
    5: "SEE THROUGH YOUR CHILD'S EYES",
    6: "EXPLORE ALIGNED OPTIONS",
    7: "CHOOSE + COMMUNICATE"
  }

  const stepDescriptions = {
    1: "Name the co-parenting issue clearly and specifically",
    2: "Explore the emotions and feelings beneath the surface",
    3: "Identify your core values and what truly matters",
    4: "Consider your co-parent's perspective with empathy",
    5: "Center your child's experience and needs",
    6: "Generate creative solutions that work for everyone",
    7: "Craft a clear, respectful message to move forward"
  }

  return (
    <div className="h-screen bg-gray-50 flex justify-center overflow-hidden">
      <div className="flex w-full max-w-7xl h-full">
        {/* Left Sidebar - Fixed */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Phase {currentStep}: {stepTitles[currentStep as keyof typeof stepTitles]}
            </h2>
            <p className="text-xs text-gray-600">
              {stepDescriptions[currentStep as keyof typeof stepDescriptions]}
            </p>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{completedSteps.length}/7</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(completedSteps.length / 7) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Progress Steps - Scrollable if needed */}
          <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-300">
            <div className="space-y-2">
              {Object.entries(stepTitles).map(([step, title]) => {
                const stepNum = Number(step)
                const isComplete = completedSteps.includes(stepNum)
                const isCurrent = stepNum === currentStep
                
                return (
                  <div
                    key={step}
                    className={`p-2.5 rounded-lg border transition-all ${
                      isCurrent 
                        ? 'bg-teal-50 border-teal-300' 
                        : isComplete 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
                        isCurrent 
                          ? 'bg-teal-600 text-white' 
                          : isComplete 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-300 text-gray-600'
                      }`}>
                        {isComplete ? '✓' : stepNum}
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-xs font-medium ${
                          isCurrent ? 'text-teal-900' : isComplete ? 'text-green-900' : 'text-gray-700'
                        }`}>
                          {title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {/* Show summary for completed phases, description for others */}
                          {isComplete && phaseSummaries[stepNum] ? (
                            <span className="italic text-gray-600">"{phaseSummaries[stepNum]}"</span>
                          ) : (
                            stepDescriptions[stepNum as keyof typeof stepDescriptions]
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Sidebar Footer */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => navigate('/start')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Home
            </button>
          </div>
        </div>

        {/* Main content - Scrollable */}
        <div className="flex-1 flex flex-col max-w-3xl bg-white h-full overflow-hidden">
          {/* Header - Fixed at top */}
          <header className="px-6 py-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900">
                BeAligned™ Reflection
              </h1>
              {adminMode && (
                <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">
                  <Settings className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Admin Mode</span>
                </div>
              )}
            </div>
          </header>

          {/* Chat area with input always visible */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages area - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-gray-300">
              <div className="space-y-2">
                {messages.map(message => {
                  const isBeingRefined = isRefining === message.id
                  const isBeingCategorized = isCategorizing === message.id
                  
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
                        </div>
                      ) : isBeingCategorized ? (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                          <h3 className="text-sm font-semibold text-gray-700 mb-3">Categorize User Response</h3>
                          <div className="space-y-2 mb-4">
                        {Object.entries(categoryLabels).map(([key, value]) => (
                          <label key={key} className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="category"
                              value={key}
                              checked={selectedCategory === key}
                              onChange={() => setSelectedCategory(key as ResponseCategory)}
                              className="mt-1"
                            />
                            <div>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${value.color}`}>
                                {value.label}
                              </span>
                              <p className="text-xs text-gray-600 mt-0.5">{value.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveCategorization}
                          disabled={!selectedCategory}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                        >
                          <Save className="w-3 h-3" />
                          Save Category
                        </button>
                        <button
                          onClick={() => {
                            setIsCategorizing(null)
                            setSelectedCategory(null)
                          }}
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
                            stepId={message.stepId || currentStep}
                            showFeedback={adminMode && message.type === 'ai'}
                          />
                          {/* Source indicator for AI responses in admin mode */}
                          {adminMode && message.type === 'ai' && message.source && (
                            <div className="ml-11 mt-1">
                              <button
                                onClick={() => message.source === 'fallback' && message.errorDetails ? 
                                  setShowingErrorDetails(showingErrorDetails === message.id ? null : message.id) : 
                                  null
                                }
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                  message.source === 'fallback' ? 'bg-red-100 text-red-700 cursor-pointer hover:bg-red-200' :
                                  message.source === 'refined' ? 'bg-green-100 text-green-700' :
                                  message.source === 'knowledge' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                } ${message.source !== 'fallback' ? 'cursor-default' : ''}`}
                              >
                                {message.source === 'fallback' ? '⚠️ Fallback' :
                                 message.source === 'refined' ? '✨ Refined' :
                                 message.source === 'knowledge' ? '📚 Knowledge' :
                                 '🤖 AI Generated'}
                              </button>
                              {showingErrorDetails === message.id && message.errorDetails && (
                                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <p className="text-xs text-red-800 font-mono">{message.errorDetails}</p>
                                </div>
                              )}
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
                                <button
                                  onClick={() => handleStartRefinement(message.id, message.content)}
                                  className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md border"
                                  title="Refine this response"
                                >
                                  <Edit3 className="w-4 h-4 text-gray-600" />
                                </button>
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
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {/* Thinking indicator between message bubbles */}
                {showThinking && (
                  <div className="flex justify-start mb-3">
                    <div className="ml-11 mt-1">
                      <div className="inline-block px-4 py-2 bg-gray-100 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-sm text-gray-500">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

          {/* Session Completion UI */}
          {sessionComplete ? (
            <div className="border-t px-6 py-4 flex-shrink-0 bg-green-50 border-green-200">
              <div className="flex flex-col gap-3">
                <div className="text-sm text-green-800 font-medium">
                  🎉 Reflection Complete! All 7 phases finished.
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyMessage}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Message
                  </button>
                  <button
                    onClick={handleDownloadMessage}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button
                    onClick={() => setShowFeedback(true)}
                    className="px-3 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 flex items-center gap-1.5"
                  >
                    <Star className="w-3.5 h-3.5" />
                    Feedback
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Input area - Fixed at bottom */
            <div className="border-t px-6 py-4 flex-shrink-0 bg-white">
              <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={loading ? "Thinking..." : "Type your response..."}
                  disabled={loading}
                  autoFocus
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </form>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">How was your reflection experience?</h3>
            
            {/* Star Rating */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-2">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`w-8 h-8 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                  >
                    <Star className="w-full h-full fill-current" />
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Text */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Comments (optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                rows={3}
                placeholder="Share your thoughts about the reflection process..."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowFeedback(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={rating === 0}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}