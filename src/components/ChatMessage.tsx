import { clsx } from 'clsx'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

interface ChatMessageProps {
  type: 'ai' | 'user'
  content: string
  timestamp?: Date
  responseId?: string
  sessionId?: string
  stepId?: number
  showFeedback?: boolean
  onFeedback?: (isHelpful: boolean) => void
}

export function ChatMessage({ 
  type, 
  content, 
  timestamp, 
  responseId,
  sessionId,
  stepId,
  showFeedback = false,
  onFeedback 
}: ChatMessageProps) {
  const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'unhelpful' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Format content to render markdown-style formatting
  const formattedContent = useMemo(() => {
    if (type !== 'ai') return content
    
    // Split by lines to preserve structure
    const lines = content.split('\n')
    return lines.map((line, idx) => {
      // Check if line contains ** for bold formatting
      if (line.includes('**')) {
        // Replace **text** with bold and larger font
        const parts = line.split(/\*\*/)
        return (
          <span key={idx}>
            {parts.map((part, i) => 
              i % 2 === 1 ? (
                <strong key={i} className="font-semibold text-base italic">
                  {part}
                </strong>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
            {idx < lines.length - 1 && <br />}
          </span>
        )
      }
      
      // Check for horizontal rule
      if (line.trim() === '---') {
        return <hr key={idx} className="my-3 border-gray-300" />
      }
      
      // Regular line
      return (
        <span key={idx}>
          {line}
          {idx < lines.length - 1 && <br />}
        </span>
      )
    })
  }, [content, type])

  const handleFeedback = async (isHelpful: boolean) => {
    if (feedbackGiven || isSubmitting) return
    
    setIsSubmitting(true)
    
    // Store feedback in database
    if (responseId && sessionId && stepId) {
      const { error } = await supabase
        .from('response_feedback')
        .insert({
          response_id: responseId,
          session_id: sessionId,
          step_id: stepId,
          is_helpful: isHelpful
        })
      
      if (!error) {
        setFeedbackGiven(isHelpful ? 'helpful' : 'unhelpful')
        onFeedback?.(isHelpful)
      }
    } else {
      // Just update UI if no database connection
      setFeedbackGiven(isHelpful ? 'helpful' : 'unhelpful')
      onFeedback?.(isHelpful)
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className={clsx(
      'flex gap-3 mb-6 group',
      type === 'user' && 'flex-row-reverse'
    )}>
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        type === 'ai' 
          ? 'bg-gradient-to-br from-teal-400 to-teal-500'
          : 'bg-gradient-to-br from-blue-400 to-blue-500'
      )}>
        <span className="text-white text-sm">
          {type === 'ai' ? 'BA' : 'You'}
        </span>
      </div>
      
      <div className={clsx(
        'flex-1 max-w-[85%]',
        type === 'user' && 'flex justify-end'
      )}>
        <div>
          <div className={clsx(
            'rounded-2xl px-4 py-3',
            type === 'ai' 
              ? 'bg-gray-50 text-gray-800'
              : 'bg-blue-600 text-white'
          )}>
            <div className="text-sm leading-relaxed">
              {type === 'ai' ? formattedContent : content}
            </div>
          </div>
          
          {/* Feedback buttons for AI messages */}
          {type === 'ai' && showFeedback && (
            <div className={clsx(
              'flex items-center gap-3 mt-2 px-2 transition-opacity',
              feedbackGiven ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}>
              <button
                onClick={() => handleFeedback(true)}
                disabled={!!feedbackGiven || isSubmitting}
                className={clsx(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all',
                  feedbackGiven === 'helpful'
                    ? 'bg-green-100 text-green-700'
                    : feedbackGiven
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:bg-gray-100 text-gray-500 hover:text-green-600'
                )}
                title="This was helpful"
              >
                <ThumbsUp className="w-3 h-3" />
                <span>Helpful</span>
              </button>
              
              <button
                onClick={() => handleFeedback(false)}
                disabled={!!feedbackGiven || isSubmitting}
                className={clsx(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all',
                  feedbackGiven === 'unhelpful'
                    ? 'bg-red-100 text-red-700'
                    : feedbackGiven
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:bg-gray-100 text-gray-500 hover:text-red-600'
                )}
                title="This wasn't helpful"
              >
                <ThumbsDown className="w-3 h-3" />
                <span>Not helpful</span>
              </button>
              
              {feedbackGiven && (
                <span className="text-xs text-gray-500 ml-2">
                  Thank you for your feedback!
                </span>
              )}
            </div>
          )}
          
          {timestamp && (
            <p className="text-xs text-gray-400 mt-1 px-2">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}