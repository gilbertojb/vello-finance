import { cn } from '@/lib/utils'

type Props = {
  currentStep: 1 | 2
  totalSteps?: number
}

export function StepIndicator({ currentStep, totalSteps = 2 }: Props) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
              step < currentStep
                ? 'bg-primary text-primary-foreground'
                : step === currentStep
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {step < currentStep ? '✓' : step}
          </div>
          {step < totalSteps && (
            <div
              className={cn(
                'h-px w-8',
                step < currentStep ? 'bg-primary' : 'bg-border',
              )}
            />
          )}
        </div>
      ))}
      <span className="ml-2 text-xs text-muted-foreground">
        Passo {currentStep} de {totalSteps}
      </span>
    </div>
  )
}
