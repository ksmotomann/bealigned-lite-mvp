import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, CheckCircle, XCircle, Edit2, Save, RefreshCw, Tag, BarChart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Response {
  id: string
  session_id: string
  step_id: number
  user_text: string
  ai_text: string
  refined_text?: string
  feedback?: string
  created_at: string
  knowledge_audit?: any
}

interface ValidationResult {
  step: number
  stepTitle: string
  userInput: string
  score: number
  valid: boolean
  feedback: string[]
}

export default function Admin() {
  const navigate = useNavigate()
  const [responses, setResponses] = useState<Response[]>([])
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null)
  const [refinedText, setRefinedText] = useState('')
  const [feedback, setFeedback] = useState('')
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'responses' | 'validation' | 'comparisons' | 'categories'>('responses')
  const [comparisons, setComparisons] = useState<any[]>([])
  const [improvements, setImprovements] = useState<any[]>([])
  const [categoryStats, setCategoryStats] = useState<any[]>([])
  const [categoryPatterns, setCategoryPatterns] = useState<any[]>([])

  useEffect(() => {
    loadResponses()
    loadValidationResults()
    loadComparisons()
    loadImprovements()
    loadCategoryStats()
  }, [])

  const loadResponses = async () => {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setResponses(data)
    }
    setLoading(false)
  }

  const loadValidationResults = async () => {
    // Load latest validation results
    const { data } = await supabase
      .from('validation_results')
      .select('results')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data?.results) {
      setValidationResults(data.results)
    }
  }

  const loadComparisons = async () => {
    const { data } = await supabase
      .from('gpt_reference_responses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      setComparisons(data)
    }
  }

  const loadImprovements = async () => {
    const { data } = await supabase
      .from('model_improvements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (data) {
      setImprovements(data)
    }
  }

  const loadCategoryStats = async () => {
    // Load category statistics
    const { data: stats } = await supabase
      .from('responses')
      .select('user_response_category, step_id')
      .not('user_response_category', 'is', null)
      
    if (stats) {
      // Process stats into counts by category
      const categoryCounts: Record<string, number> = {}
      stats.forEach(r => {
        const cat = r.user_response_category
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
      })
      
      const statsArray = Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count,
        percentage: ((count / stats.length) * 100).toFixed(1)
      }))
      
      setCategoryStats(statsArray)
    }
    
    // Load category patterns
    const { data: patterns } = await supabase
      .from('response_category_patterns')
      .select('*')
      .order('frequency', { ascending: false })
      .limit(20)
      
    if (patterns) {
      setCategoryPatterns(patterns)
    }
  }

  const handleRefine = async () => {
    if (!selectedResponse || !refinedText) return

    // Store refined response
    const { error } = await supabase
      .from('refined_responses')
      .insert({
        response_id: selectedResponse.id,
        original_text: selectedResponse.ai_text,
        refined_text: refinedText,
        feedback: feedback,
        step_id: selectedResponse.step_id,
        user_text: selectedResponse.user_text
      })

    if (!error) {
      alert('Refinement saved! This will be used to improve future responses.')
      setSelectedResponse(null)
      setRefinedText('')
      setFeedback('')
    }
  }

  const runValidation = async () => {
    setLoading(true)
    try {
      // This would call the validation script
      const response = await fetch('/api/validate', {
        method: 'POST'
      })
      
      if (response.ok) {
        await loadValidationResults()
        alert('Validation complete!')
      }
    } catch (error) {
      console.error('Validation error:', error)
      alert('Validation failed. Check console for details.')
    }
    setLoading(false)
  }

  const stepTitles = {
    1: "Name the Issue",
    2: "Explore Feelings", 
    3: "Identify Values",
    4: "Co-Parent's Perspective",
    5: "Child's Perspective",
    6: "Generate Options",
    7: "Craft Message"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/start')}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Response Admin</h1>
          <p className="mt-2 text-gray-600">Review, validate, and refine AI responses to improve the system</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('responses')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'responses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Response Review
            </button>
            <button
              onClick={() => setActiveTab('validation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'validation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Validation Results
            </button>
            <button
              onClick={() => setActiveTab('comparisons')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'comparisons'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              GPT Comparisons
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Response Categories
            </button>
          </nav>
        </div>

        {activeTab === 'responses' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Response List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Recent Responses</h2>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center text-gray-500">Loading...</div>
                ) : (
                  <div className="divide-y">
                    {responses.map(response => (
                      <div
                        key={response.id}
                        onClick={() => {
                          setSelectedResponse(response)
                          setRefinedText(response.refined_text || response.ai_text)
                          setFeedback('')
                        }}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-blue-600">
                            Step {response.step_id}: {stepTitles[response.step_id as keyof typeof stepTitles]}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(response.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                          <strong>User:</strong> {response.user_text}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          <strong>AI:</strong> {response.ai_text}
                        </p>
                        {response.refined_text && (
                          <div className="mt-2 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-green-600">Refined</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Refinement Panel */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Refine Response</h2>
              </div>
              {selectedResponse ? (
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Step {selectedResponse.step_id}: {stepTitles[selectedResponse.step_id as keyof typeof stepTitles]}
                    </label>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-700">
                        <strong>User Input:</strong> {selectedResponse.user_text}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original AI Response
                    </label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">{selectedResponse.ai_text}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refined Response
                    </label>
                    <textarea
                      value={refinedText}
                      onChange={(e) => setRefinedText(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                      placeholder="Enter an improved response that better follows BeAligned principles..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback / Notes
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="What principles should this response follow? What was missing?"
                    />
                  </div>

                  <button
                    onClick={handleRefine}
                    className="w-full btn btn-primary flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Refinement
                  </button>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <Edit2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Select a response to refine</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'validation' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Validation Results</h2>
              <button
                onClick={runValidation}
                disabled={loading}
                className="btn btn-secondary flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Run Validation
              </button>
            </div>
            <div className="p-6">
              {validationResults.length > 0 ? (
                <div className="space-y-4">
                  {validationResults.map((result, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-sm font-medium text-blue-600">
                            Step {result.step}: {result.stepTitle}
                          </span>
                          <p className="text-sm text-gray-700 mt-1">
                            {result.userInput.substring(0, 100)}...
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.valid ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <span className={`text-sm font-medium ${
                            result.valid ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {result.score.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        {result.feedback.map((f, i) => (
                          <p key={i} className={`text-xs ${
                            f.startsWith('✓') ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {f}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No validation results yet</p>
                  <p className="text-sm mt-2">Run validation to test responses against expected patterns</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'comparisons' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Comparisons List */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">GPT Response Comparisons</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Side-by-side analysis of app vs reference GPT responses
                </p>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {comparisons.length > 0 ? (
                  <div className="divide-y">
                    {comparisons.map(comp => (
                      <div key={comp.id} className="p-4 hover:bg-gray-50">
                        <div className="mb-2">
                          <span className="text-sm font-medium text-blue-600">
                            Step {comp.step_id}: {stepTitles[comp.step_id as keyof typeof stepTitles]}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(comp.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>User:</strong> {comp.user_text.substring(0, 100)}...
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-50 p-2 rounded">
                            <strong className="text-gray-600">App:</strong>
                            <p className="mt-1">{comp.app_response.substring(0, 100)}...</p>
                          </div>
                          <div className="bg-green-50 p-2 rounded">
                            <strong className="text-green-600">GPT:</strong>
                            <p className="mt-1">{comp.gpt_response.substring(0, 100)}...</p>
                          </div>
                        </div>
                        {comp.improvements_needed && comp.improvements_needed.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-600">Improvements:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {comp.improvements_needed.map((imp: string, i: number) => (
                                <span key={i} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                                  {imp}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {comp.comparison_notes && (
                          <p className="text-xs text-gray-600 mt-2 italic">
                            Notes: {comp.comparison_notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <p>No comparisons yet</p>
                    <p className="text-sm mt-2">Use the compare button in chat to add GPT references</p>
                  </div>
                )}
              </div>
            </div>

            {/* Improvement Patterns */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Model Improvement Patterns</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Patterns learned from GPT comparisons
                </p>
              </div>
              <div className="p-6">
                {improvements.length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(
                      improvements.reduce((acc: any, imp) => {
                        if (!acc[imp.pattern_type]) acc[imp.pattern_type] = []
                        acc[imp.pattern_type].push(imp)
                        return acc
                      }, {})
                    ).map(([type, items]: [string, any]) => (
                      <div key={type} className="border rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2 capitalize">
                          {type} Patterns ({items.length})
                        </h3>
                        <div className="space-y-2">
                          {items.slice(0, 3).map((item: any) => (
                            <div key={item.id} className="bg-gray-50 p-3 rounded text-sm">
                              <p className="text-gray-600 mb-1">
                                <strong>Trigger:</strong> "{item.trigger_phrase}..."
                              </p>
                              <p className="text-green-600">
                                <strong>Better:</strong> "{item.improved_response.substring(0, 100)}..."
                              </p>
                              {item.improvement_reason && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Reason: {item.improvement_reason}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-medium text-blue-900 mb-2">Key Insights</h3>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• GPT responses average {Math.round(comparisons.reduce((acc, c) => acc + (c.gpt_response?.length || 0), 0) / Math.max(comparisons.length, 1))} characters</li>
                        <li>• Most common improvement: More empathetic language</li>
                        <li>• GPT uses questions in {comparisons.filter(c => c.gpt_response?.includes('?')).length}/{comparisons.length} responses</li>
                        <li>• Active improvement patterns: {improvements.length}</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <p>No improvement patterns yet</p>
                    <p className="text-sm mt-2">Patterns will appear as you add comparisons</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Statistics */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Category Distribution</h2>
                <p className="text-sm text-gray-600 mt-1">User response types</p>
              </div>
              <div className="p-6">
                {categoryStats.length > 0 ? (
                  <div className="space-y-3">
                    {categoryStats.map((stat: any) => {
                      const categoryInfo = {
                        'direct_answer': { label: 'Direct Answer', color: 'bg-green-500' },
                        'partial_indirect_answer': { label: 'Partial/Indirect', color: 'bg-yellow-500' },
                        'conversational_social': { label: 'Social', color: 'bg-blue-500' },
                        'meta_app_directed': { label: 'Meta/App', color: 'bg-purple-500' },
                        'off_topic_non_sequitur': { label: 'Off-Topic', color: 'bg-gray-500' },
                        'refusal_avoidance': { label: 'Refusal', color: 'bg-red-500' },
                        'emotional_expressive': { label: 'Emotional', color: 'bg-pink-500' }
                      }
                      const info = categoryInfo[stat.category as keyof typeof categoryInfo]
                      
                      return (
                        <div key={stat.category}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {info?.label || stat.category}
                            </span>
                            <span className="text-sm text-gray-500">
                              {stat.count} ({stat.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${info?.color || 'bg-gray-500'}`}
                              style={{ width: `${stat.percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">No categorized responses yet</p>
                )}
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Insights</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Direct answers indicate good engagement</li>
                    <li>• High refusal rate may need softer prompts</li>
                    <li>• Emotional responses show trust building</li>
                    <li>• Meta comments suggest UI confusion</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Category Patterns */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Response Patterns by Category</h2>
                <p className="text-sm text-gray-600 mt-1">Common patterns identified</p>
              </div>
              <div className="p-6">
                {categoryPatterns.length > 0 ? (
                  <div className="space-y-4">
                    {categoryPatterns.slice(0, 10).map((pattern: any) => {
                      const categoryInfo = {
                        'direct_answer': { color: 'bg-green-100 text-green-700' },
                        'partial_indirect_answer': { color: 'bg-yellow-100 text-yellow-700' },
                        'conversational_social': { color: 'bg-blue-100 text-blue-700' },
                        'meta_app_directed': { color: 'bg-purple-100 text-purple-700' },
                        'off_topic_non_sequitur': { color: 'bg-gray-100 text-gray-700' },
                        'refusal_avoidance': { color: 'bg-red-100 text-red-700' },
                        'emotional_expressive': { color: 'bg-pink-100 text-pink-700' }
                      }
                      const info = categoryInfo[pattern.category as keyof typeof categoryInfo]
                      
                      return (
                        <div key={pattern.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${info?.color || 'bg-gray-100'}`}>
                                {pattern.category.replace(/_/g, ' ')}
                              </span>
                              <span className="text-sm text-gray-600">
                                Step {pattern.step_id}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              Seen {pattern.frequency}x
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 italic">
                            "{pattern.pattern_text.substring(0, 150)}..."
                          </p>
                          {pattern.requires_followup && (
                            <p className="text-xs text-orange-600 mt-1">
                              ⚠️ Usually requires follow-up probing
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No patterns identified yet</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Categorize responses in chat to build patterns
                    </p>
                  </div>
                )}
                
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <BarChart className="w-8 h-8 text-green-600 mb-2" />
                    <h4 className="font-medium text-green-900">Best Performing</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Sessions with 60%+ direct answers progress smoothly
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <Tag className="w-8 h-8 text-orange-600 mb-2" />
                    <h4 className="font-medium text-orange-900">Needs Attention</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      High refusal rate in Step 4 (co-parent perspective)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}