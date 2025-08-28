import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { clsx } from 'clsx'

interface OptionsBuilderProps {
  sessionId: string
  onOptionsUpdate: () => void
}

export function OptionsBuilder({ sessionId, onOptionsUpdate }: OptionsBuilderProps) {
  const [options, setOptions] = useState<any[]>([])
  const [newOption, setNewOption] = useState('')
  const [selectedWhys, setSelectedWhys] = useState<string[]>([])

  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    const { data } = await supabase
      .from('options')
      .select('*')
      .eq('session_id', sessionId)
      .order('rank')
    
    if (data) {
      setOptions(data)
    }
  }

  const addOption = async () => {
    if (!newOption.trim()) return
    
    const { error } = await supabase
      .from('options')
      .insert({
        session_id: sessionId,
        text: newOption,
        why_tags: selectedWhys,
        rank: options.length + 1
      })

    if (!error) {
      setNewOption('')
      setSelectedWhys([])
      loadOptions()
      onOptionsUpdate()
    }
  }

  const deleteOption = async (id: string) => {
    await supabase
      .from('options')
      .delete()
      .eq('id', id)
    
    loadOptions()
    onOptionsUpdate()
  }

  const whyOptions = ['Your needs', 'Their needs', "Child's needs", 'Shared values', 'Practical']

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add an option that could work:
        </label>
        <textarea
          className="textarea min-h-[80px]"
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          placeholder="Describe a possible solution..."
        />
        
        <div className="mt-3 space-y-2">
          <p className="text-sm text-gray-600">This option serves:</p>
          <div className="flex flex-wrap gap-2">
            {whyOptions.map((why) => (
              <button
                key={why}
                onClick={() => {
                  setSelectedWhys(prev =>
                    prev.includes(why)
                      ? prev.filter(w => w !== why)
                      : [...prev, why]
                  )
                }}
                className={clsx(
                  'px-3 py-1 rounded-full text-sm transition-colors',
                  selectedWhys.includes(why)
                    ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {why}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={addOption}
          disabled={!newOption.trim() || selectedWhys.length === 0}
          className="mt-4 btn btn-primary py-2 px-4"
        >
          Add Option
        </button>
      </div>

      {options.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Your Options:</h3>
          {options.map((option, index) => (
            <div key={option.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-gray-900">
                    {index + 1}. {option.text}
                  </p>
                  {option.why_tags && option.why_tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {option.why_tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteOption(option.id)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {options.length < 3 && (
        <p className="text-sm text-amber-600">
          Please add at least 3 options to continue.
        </p>
      )}
    </div>
  )
}