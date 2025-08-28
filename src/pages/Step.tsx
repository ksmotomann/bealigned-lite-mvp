import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSession } from '@/contexts/SessionContext'
import { supabase } from '@/lib/supabase'
import { StepNavigation } from '@/components/StepNavigation'
import { StepContent } from '@/components/StepContent'

export default function Step() {
  const { stepId } = useParams()
  const navigate = useNavigate()
  const { sessionId } = useSession()
  const [step, setStep] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userInput, setUserInput] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadStep()
    loadPreviousResponse()
  }, [stepId])

  const loadStep = async () => {
    try {
      const { data, error } = await supabase
        .from('steps')
        .select('*, prompts(*)')
        .eq('id', Number(stepId))
        .single()

      if (error) throw error
      setStep(data)
    } catch (error) {
      console.error('Error loading step:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPreviousResponse = async () => {
    try {
      const { data } = await supabase
        .from('responses')
        .select('*')
        .eq('session_id', sessionId)
        .eq('step_id', Number(stepId))
        .single()

      if (data) {
        setUserInput(data.user_text || '')
        setAiResponse(data.ai_text || '')
      }
    } catch (error) {
      // No previous response is fine
    }
  }

  const handleSubmit = async () => {
    if (!userInput.trim()) return
    
    setSubmitting(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/responses-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          step_id: Number(stepId),
          user_text: userInput,
        }),
      })

      const data = await response.json()
      setAiResponse(data.ai_text)
    } catch (error) {
      console.error('Error submitting response:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    const nextStep = Number(stepId) + 1
    if (nextStep <= 7) {
      navigate(`/step/${nextStep}`)
    } else {
      navigate('/start')
    }
  }

  const handlePrevious = () => {
    const prevStep = Number(stepId) - 1
    if (prevStep >= 1) {
      navigate(`/step/${prevStep}`)
    }
  }

  if (loading || !step) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading step...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900">BeAligned Lite</h1>
            <button
              onClick={() => navigate('/start')}
              className="text-gray-600 hover:text-gray-900"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <StepNavigation currentStep={Number(stepId)} totalSteps={7} />
        
        <div className="mt-8 card">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Step {stepId}: {step.title}
          </h2>
          <p className="text-gray-600 mb-6">{step.description}</p>

          <StepContent
            step={step}
            stepId={Number(stepId)}
            userInput={userInput}
            setUserInput={setUserInput}
            aiResponse={aiResponse}
            onSubmit={handleSubmit}
            submitting={submitting}
            sessionId={sessionId!}
          />

          <div className="mt-8 flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={Number(stepId) === 1}
              className="btn btn-secondary py-2 px-4 disabled:opacity-50"
            >
              Previous
            </button>
            
            <button
              onClick={handleNext}
              disabled={!aiResponse}
              className="btn btn-primary py-2 px-4 disabled:opacity-50"
            >
              {Number(stepId) === 7 ? 'Complete' : 'Next Step'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}