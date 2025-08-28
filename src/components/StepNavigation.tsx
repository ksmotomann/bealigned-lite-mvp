import { clsx } from 'clsx'

interface StepNavigationProps {
  currentStep: number
  totalSteps: number
}

export function StepNavigation({ currentStep, totalSteps }: StepNavigationProps) {
  return (
    <div className="flex items-center justify-center space-x-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
              {
                'bg-primary-600 text-white': step === currentStep,
                'bg-primary-100 text-primary-600': step < currentStep,
                'bg-gray-200 text-gray-500': step > currentStep,
              }
            )}
          >
            {step}
          </div>
          {step < totalSteps && (
            <div
              className={clsx('w-12 h-0.5 mx-1', {
                'bg-primary-600': step < currentStep,
                'bg-gray-300': step >= currentStep,
              })}
            />
          )}
        </div>
      ))}
    </div>
  )
}