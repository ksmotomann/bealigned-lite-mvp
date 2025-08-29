import { useNavigate } from 'react-router-dom'
import { useSession } from '@/contexts/SessionContext'
import { supabase } from '@/lib/supabase'

export default function Complete() {
  const navigate = useNavigate()
  const { sessionId, setSessionId } = useSession()

  const startNewReflection = async () => {
    // Create a new session
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (data && !error) {
      setSessionId(data.id)
      navigate('/step/1')
    } else {
      console.error('Error creating new session:', error)
    }
  }

  const viewCurrentReflection = () => {
    navigate('/reflection')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="card text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reflection Complete!</h1>
            <p className="text-lg text-gray-600">
              You've successfully worked through all 7 steps of the BeAligned process.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What you've accomplished:</h2>
            <ul className="text-left space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Named and explored your co-parenting challenge
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Identified your feelings and underlying values
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Considered your co-parent's perspective
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Focused on your child's needs
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Generated collaborative solutions
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Crafted a CLEAR message to communicate
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={viewCurrentReflection}
              className="btn btn-secondary w-full py-3"
            >
              View Your Complete Reflection
            </button>
            <button
              onClick={startNewReflection}
              className="btn btn-primary w-full py-3"
            >
              Start a New Reflection
            </button>
            <button
              onClick={() => navigate('/start')}
              className="text-gray-600 hover:text-gray-900 py-2"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}