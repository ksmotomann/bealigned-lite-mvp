import { clsx } from 'clsx'
import { Check, Heart, User, Baby, Lightbulb, MessageSquare, Target } from 'lucide-react'

interface ProgressTrackerProps {
  currentStep: number
  completedSteps: number[]
}

const stepInfo = [
  { id: 1, title: 'Issue Named', icon: Target, color: 'text-blue-600' },
  { id: 2, title: 'Feelings Explored', icon: Heart, color: 'text-red-500' },
  { id: 3, title: 'Purpose Identified', icon: Lightbulb, color: 'text-yellow-500' },
  { id: 4, title: 'Co-Parent Perspective', icon: User, color: 'text-green-500' },
  { id: 5, title: 'Child Perspective', icon: Baby, color: 'text-purple-500' },
  { id: 6, title: 'Options Generated', icon: Lightbulb, color: 'text-indigo-500' },
  { id: 7, title: 'Message Drafted', icon: MessageSquare, color: 'text-pink-500' }
]

export function ProgressTracker({ currentStep, completedSteps }: ProgressTrackerProps) {
  const progress = (completedSteps.length / 7) * 100

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Reflection Progress</h3>
      <p className="text-sm text-gray-600 mb-6">Track your journey through the process</p>
      
      <div className="space-y-3">
        {stepInfo.map((step) => {
          const isCompleted = completedSteps.includes(step.id)
          const isCurrent = step.id === currentStep
          const Icon = step.icon
          
          return (
            <div
              key={step.id}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-lg transition-colors',
                isCurrent && 'bg-blue-50 border border-blue-200',
                isCompleted && !isCurrent && 'bg-gray-50'
              )}
            >
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center',
                isCompleted 
                  ? 'bg-green-100 text-green-600' 
                  : isCurrent 
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-400'
              )}>
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              
              <div className="flex-1">
                <p className={clsx(
                  'text-sm font-medium',
                  isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                )}>
                  {step.title}
                </p>
              </div>
              
              <div className={clsx(
                'w-5 h-5 rounded-full',
                isCompleted 
                  ? 'bg-green-500' 
                  : isCurrent
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-gray-300'
              )} />
            </div>
          )
        })}
      </div>
      
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{completedSteps.length}/7 phases complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}