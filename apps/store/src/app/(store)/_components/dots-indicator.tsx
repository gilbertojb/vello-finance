type Step = { slug: string; label: string }

type Props = {
  steps: Step[]
  currentStep: string
}

export const SIMULATOR_STEPS: Step[] = [
  { slug: 'produto', label: 'Produto' },
  { slug: 'dados', label: 'Dados' },
  { slug: 'resultado', label: 'Resultado' },
]

export function DotsIndicator({ steps, currentStep }: Props) {
  const currentIndex = steps.findIndex((s) => s.slug === currentStep)

  return (
    <div className="mb-6 w-full">
      <div className="flex items-center gap-1.5">
        {steps.map((s, i) => (
          <div
            key={s.slug}
            className={
              i < currentIndex
                ? 'h-2 w-2 rounded-full bg-primary'
                : i === currentIndex
                  ? 'h-2 w-5 rounded-full bg-primary'
                  : 'h-2 w-2 rounded-full bg-surface-foreground/12'
            }
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-surface-foreground/50">
          {currentIndex >= 0 && (
            <>
              Passo{' '}
              <span className="text-surface-foreground/80">{currentIndex + 1}</span> de{' '}
              <span className="text-surface-foreground/80">{steps.length}</span>
            </>
          )}
        </p>
        {currentIndex >= 0 && (
          <p className="text-xs font-semibold text-surface-foreground/70">
            {steps[currentIndex]?.label}
          </p>
        )}
      </div>
    </div>
  )
}
