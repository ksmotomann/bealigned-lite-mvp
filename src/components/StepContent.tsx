import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { FeelingsChips } from './FeelingsChips'
import { ValuesChips } from './ValuesChips'
import { OptionsBuilder } from './OptionsBuilder'
import { MessageEditor } from './MessageEditor'

interface StepContentProps {
  step: any
  stepId: number
  userInput: string
  setUserInput: (value: string) => void
  aiResponse: string
  onSubmit: () => void
  submitting: boolean
  sessionId: string
}

export function StepContent({
  step,
  stepId,
  userInput,
  setUserInput,
  aiResponse,
  onSubmit,
  submitting,
  sessionId
}: StepContentProps) {
  const [messagePreview, setMessagePreview] = useState('')
  
  const userPrompt = step.prompts?.find((p: any) => p.kind === 'user_prompt')
  
  useEffect(() => {
    if (stepId >= 3) {
      loadMessagePreview()
    }
  }, [stepId, aiResponse])

  const loadMessagePreview = async () => {
    try {
      const { data } = await supabase
        .from('responses')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (data) {
        const feelings = data.find(r => r.step_id === 2)?.user_text || ''
        const situation = data.find(r => r.step_id === 1)?.user_text || ''
        const values = data.find(r => r.step_id === 3)?.user_text || ''
        
        if (feelings && situation) {
          setMessagePreview(
            `I feel ${extractFeeling(feelings)} when ${situation.slice(0, 50)}... because ${extractValue(values)}.`
          )
        }
      }
    } catch (error) {
      console.error('Error loading preview:', error)
    }
  }

  const extractFeeling = (text: string) => {
    const match = text.match(/feel\s+(\w+)/i)
    return match?.[1] || 'concerned'
  }

  const extractValue = (text: string) => {
    return text.slice(0, 30) || 'this matters to our family'
  }

  const renderStepSpecificContent = () => {
    switch (stepId) {
      case 2:
        return (
          <FeelingsChips
            selectedFeelings={userInput.split(',').map(f => f.trim()).filter(Boolean)}
            onToggleFeeling={(feeling) => {
              const current = userInput.split(',').map(f => f.trim()).filter(Boolean)
              if (current.includes(feeling)) {
                setUserInput(current.filter(f => f !== feeling).join(', '))
              } else {
                setUserInput([...current, feeling].join(', '))
              }
            }}
          />
        )
      
      case 3:
        return (
          <>
            <ValuesChips
              selectedValues={userInput.split(',').map(v => v.trim()).filter(Boolean)}
              onToggleValue={(value) => {
                const current = userInput.split(',').map(v => v.trim()).filter(Boolean)
                if (current.includes(value)) {
                  setUserInput(current.filter(v => v !== value).join(', '))
                } else {
                  setUserInput([...current, value].join(', '))
                }
              }}
            />
            {messagePreview && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">Message Preview:</p>
                <p className="text-sm text-blue-700">{messagePreview}</p>
              </div>
            )}
          </>
        )
      
      case 6:
        return (
          <OptionsBuilder
            sessionId={sessionId}
            onOptionsUpdate={() => {
              // Trigger refresh
            }}
          />
        )
      
      case 7:
        return (
          <MessageEditor
            sessionId={sessionId}
            initialDraft={messagePreview}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {userPrompt?.text}
        </label>
        
        {stepId !== 6 && stepId !== 7 && (
          <textarea
            className="textarea min-h-[120px]"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Share your thoughts..."
            disabled={submitting}
          />
        )}
        
        {renderStepSpecificContent()}
        
        {stepId !== 6 && stepId !== 7 && (
          <button
            onClick={onSubmit}
            disabled={submitting || !userInput.trim()}
            className="mt-4 btn btn-primary py-2 px-4"
          >
            {submitting ? 'Processing...' : 'Get Reflection'}
          </button>
        )}
      </div>

      {aiResponse && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Reflection:</p>
          <p className="text-gray-600">{aiResponse}</p>
        </div>
      )}
    </div>
  )
}