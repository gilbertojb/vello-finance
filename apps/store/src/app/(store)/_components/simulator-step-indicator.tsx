import { Check } from 'lucide-react'

const STEPS = ['Produto', 'Dados', 'Resultado']

export function SimulatorStepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-start gap-0">
      {STEPS.map((label, i) => {
        const n      = i + 1
        const done   = n < currentStep
        const active = n === currentStep
        const isLast = i === STEPS.length - 1

        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  done
                    ? 'bg-primary text-primary-foreground'
                    : active
                      ? 'bg-surface-foreground text-surface ring-4 ring-surface-foreground/10'
                      : 'bg-surface-foreground/8 text-surface-foreground/30'
                }`}
              >
                {done ? <Check className="h-3 w-3 stroke-[2.5]" /> : n}
              </div>
              <span
                className={`text-[11px] font-medium tracking-wide ${
                  done
                    ? 'text-primary'
                    : active
                      ? 'text-surface-foreground'
                      : 'text-surface-foreground/30'
                }`}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`mb-5 mx-4 h-px w-12 rounded-full transition-colors ${
                  done ? 'bg-primary/40' : 'bg-surface-foreground/12'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
