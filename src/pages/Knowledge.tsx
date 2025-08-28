import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'

export default function Knowledge() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('guardrails')
  const [content, setContent] = useState<Record<string, any>>({})

  useEffect(() => {
    loadKnowledge()
  }, [])

  const loadKnowledge = async () => {
    const { data: docs } = await supabase
      .from('knowledge_docs')
      .select('*')
    
    const { data: frameworks } = await supabase
      .from('frameworks')
      .select('*')
    
    if (docs && frameworks) {
      const organized = {
        guardrails: docs.find(d => d.title === 'BeAligned Guardrails'),
        frameworks: frameworks,
        formula: docs.find(d => d.title === 'Message Formula'),
        handoff: docs.find(d => d.title === 'Handoff Language')
      }
      setContent(organized)
    }
  }

  const tabs = [
    { id: 'guardrails', label: 'Guardrails' },
    { id: 'frameworks', label: 'Frameworks' },
    { id: 'formula', label: 'Message Formula' },
    { id: 'handoff', label: 'Handoff Language' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Knowledge Base</h1>
          <button
            onClick={() => navigate('/start')}
            className="text-gray-600 hover:text-gray-900"
          >
            Back to Start
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="card">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-6">
            {activeTab === 'guardrails' && content.guardrails && (
              <div className="prose max-w-none">
                <ReactMarkdown>{content.guardrails.content}</ReactMarkdown>
              </div>
            )}

            {activeTab === 'frameworks' && content.frameworks && (
              <div className="space-y-6">
                {content.frameworks.map((framework: any) => (
                  <div key={framework.name} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3">{framework.name}</h3>
                    {framework.content.components && (
                      <div className="space-y-2">
                        {Object.entries(framework.content.components).map(([key, value]) => (
                          <div key={key} className="flex">
                            <span className="font-medium mr-2">{key}:</span>
                            <span className="text-gray-600">{value as string}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {framework.content.examples && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Examples:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {framework.content.examples.map((example: string, i: number) => (
                            <li key={i} className="text-gray-600">{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'formula' && content.formula && (
              <div className="prose max-w-none">
                <ReactMarkdown>{content.formula.content}</ReactMarkdown>
              </div>
            )}

            {activeTab === 'handoff' && content.handoff && (
              <div className="prose max-w-none">
                <ReactMarkdown>{content.handoff.content}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 card bg-blue-50">
          <h3 className="font-semibold mb-2">Feelings & Needs Charts</h3>
          <p className="text-sm text-gray-600 mb-4">
            Visual guides to help identify and articulate emotions and needs:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium mb-2">Feelings Wheel</h4>
              <p className="text-sm text-gray-500">
                [Feelings chart would be displayed here]
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium mb-2">Needs Inventory</h4>
              <p className="text-sm text-gray-500">
                [Needs chart would be displayed here]
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}