import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { clsx } from 'clsx'

interface FeelingsChipsProps {
  selectedFeelings: string[]
  onToggleFeeling: (feeling: string) => void
}

export function FeelingsChips({ selectedFeelings, onToggleFeeling }: FeelingsChipsProps) {
  const [feelings, setFeelings] = useState<any[]>([])

  useEffect(() => {
    loadFeelings()
  }, [])

  const loadFeelings = async () => {
    const { data } = await supabase
      .from('feelings_bank')
      .select('*')
      .order('category')
    
    if (data) {
      setFeelings(data)
    }
  }

  const categorizedFeelings = feelings.reduce((acc, feeling) => {
    if (!acc[feeling.category]) acc[feeling.category] = []
    acc[feeling.category].push(feeling)
    return acc
  }, {} as Record<string, any[]>)

  const categoryLabels: Record<string, string> = {
    surface: 'Surface Feelings',
    vulnerable: 'Vulnerable Feelings',
    nuanced: 'Nuanced Feelings',
    strength_hopeful: 'Strength & Hope'
  }

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-gray-600">
        Select feelings that resonate (optional):
      </p>
      
      {Object.entries(categorizedFeelings).map(([category, feelings]) => (
        <div key={category}>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            {categoryLabels[category]}
          </h4>
          <div className="flex flex-wrap gap-2">
            {(feelings as any[]).map((feeling: any) => (
              <button
                key={feeling.term}
                onClick={() => onToggleFeeling(feeling.term)}
                className={clsx(
                  'px-3 py-1 rounded-full text-sm transition-colors',
                  selectedFeelings.includes(feeling.term)
                    ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {feeling.term}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}