import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { clsx } from 'clsx'

interface ValuesChipsProps {
  selectedValues: string[]
  onToggleValue: (value: string) => void
}

export function ValuesChips({ selectedValues, onToggleValue }: ValuesChipsProps) {
  const [values, setValues] = useState<any[]>([])

  useEffect(() => {
    loadValues()
  }, [])

  const loadValues = async () => {
    const { data } = await supabase
      .from('values_bank')
      .select('*')
      .order('category')
    
    if (data) {
      setValues(data)
    }
  }

  const categorizedValues = values.reduce((acc, value) => {
    if (!acc[value.category]) acc[value.category] = []
    acc[value.category].push(value)
    return acc
  }, {} as Record<string, any[]>)

  const categoryLabels: Record<string, string> = {
    security: 'Security & Stability',
    connection: 'Connection & Belonging',
    growth: 'Growth & Development',
    respect: 'Respect & Autonomy',
    harmony: 'Harmony & Peace'
  }

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-gray-600">
        Select values that matter most (optional):
      </p>
      
      {Object.entries(categorizedValues).map(([category, values]) => (
        <div key={category}>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            {categoryLabels[category]}
          </h4>
          <div className="flex flex-wrap gap-2">
            {(values as any[]).map((value: any) => (
              <button
                key={value.term}
                onClick={() => onToggleValue(value.term)}
                className={clsx(
                  'px-3 py-1 rounded-full text-sm transition-colors',
                  selectedValues.includes(value.term)
                    ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {value.term}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}