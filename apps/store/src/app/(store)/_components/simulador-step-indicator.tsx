import { Check } from 'lucide-react'

const STEP_LABELS = ['Produto', 'Dados', 'Resultado']

export function SimuladorStepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1
        const completed = n < currentStep
        const current = n === currentStep
        const isLast = i === STEP_LABELS.length - 1
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  completed
                    ? 'bg-primary text-primary-foreground'
                    : current
                      ? 'bg-surface-foreground text-surface'
                      : 'bg-surface-foreground/12 text-surface-foreground/35'
                }`}
              >
                {completed ? <Check className="h-4 w-4" /> : n}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  completed
                    ? 'text-primary'
                    : current
                      ? 'text-surface-foreground'
                      : 'text-surface-foreground/35'
                }`}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`mb-5 mx-3 h-px w-16 ${completed ? 'bg-primary' : 'bg-surface-foreground/12'}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
