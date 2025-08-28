import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface MessageEditorProps {
  sessionId: string
  initialDraft?: string
}

export function MessageEditor({ sessionId, initialDraft = '' }: MessageEditorProps) {
  const [draft, setDraft] = useState(initialDraft)
  const [saved, setSaved] = useState(false)
  const [framework, setFramework] = useState<'CLEAR' | 'BALANCE' | 'KIDS_NEWS'>('CLEAR')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadMessage()
  }, [])

  const loadMessage = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (data) {
      setDraft(data.final || data.draft || initialDraft)
      setFramework(data.framework as any || 'CLEAR')
    }
  }

  const saveMessage = async () => {
    const { error } = await supabase
      .from('messages')
      .upsert({
        session_id: sessionId,
        draft,
        final: draft,
        framework
      })

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const frameworkGuidance = {
    CLEAR: {
      title: 'CLEAR Framework',
      points: [
        'Concise - Keep it brief and to the point',
        'Listener-Ready - Consider their state and timing',
        'Essential - Focus on what truly matters',
        'Appropriate - Match tone to context',
        'Relevant - Connect to shared goals'
      ]
    },
    BALANCE: {
      title: 'BALANCE Framework',
      points: [
        'Balance - Consider all perspectives',
        'Aligned - Connect to shared values',
        'Linked to the Why - Ground in purpose',
        'Attainable - Set realistic expectations',
        'Necessary - Focus on what\'s needed',
        'Constructive - Build rather than tear down',
        'Evolving - Allow for growth and change'
      ]
    },
    KIDS_NEWS: {
      title: 'KIDS NEWS Format',
      points: [
        'School updates',
        'Health information',
        'Schedule changes',
        'Upcoming events',
        'Positive highlights'
      ]
    }
  }

  const messageFormula = "I feel [emotion] when [situation] because [shared Why/child outcome]. [Optional invitation]"

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Draft your message using the formula:
        </label>
        <p className="text-sm text-gray-600 italic mb-4">{messageFormula}</p>
        
        <textarea
          className="textarea min-h-[200px]"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="I feel... when... because..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Framework to apply:
        </label>
        <div className="flex gap-2">
          {(['CLEAR', 'BALANCE', 'KIDS_NEWS'] as const).map((fw) => (
            <button
              key={fw}
              onClick={() => setFramework(fw)}
              className={`px-3 py-1 rounded-md text-sm ${
                framework === fw
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {fw.replace('_', ' ')}
            </button>
          ))}
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            {frameworkGuidance[framework].title}
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            {frameworkGuidance[framework].points.map((point, i) => (
              <li key={i}>• {point}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={saveMessage}
          className="btn btn-primary py-2 px-4"
        >
          {saved ? 'Saved!' : 'Save Message'}
        </button>
        
        <button
          onClick={copyToClipboard}
          className="btn btn-secondary py-2 px-4"
        >
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>Remember:</strong> Review your message for tone and clarity. 
          Consider if this is the right time to send it. You may want to wait 
          24 hours before sending emotionally charged messages.
        </p>
      </div>
    </div>
  )
}