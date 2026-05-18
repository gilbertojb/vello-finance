'use client'

type Props = {
  steps: Array<{ slug: string; label: string }>
  currentStep: string
}

export function StepIndicator({ steps, currentStep }: Props) {
  const currentIndex = steps.findIndex((s) => s.slug === currentStep)

  return (
    <div className="mb-8 w-full">
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-foreground/10">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${Math.max(0, ((currentIndex + 1) / steps.length) * 100)}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs font-medium text-surface-foreground/50">
          {currentIndex >= 0 ? (
            <>
              Passo <span className="text-surface-foreground/80">{currentIndex + 1}</span> de{' '}
              <span className="text-surface-foreground/80">{steps.length}</span>
            </>
          ) : null}
        </p>
        {currentIndex >= 0 && (
          <p className="text-xs font-semibold text-surface-foreground/60">
            {steps[currentIndex]?.label}
          </p>
        )}
      </div>
    </div>
  )
}
