import { cn } from '@/lib/utils'

type Props = { currentStep: 1 | 2 }

export function StepIndicator({ currentStep }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-1 w-7 rounded-full bg-surface-foreground/40" />
      <span className={cn('h-1 w-7 rounded-full', currentStep === 1 ? 'bg-primary' : 'bg-surface-foreground/40')} />
      <span className={cn('h-1 w-7 rounded-full', currentStep === 2 ? 'bg-primary' : 'bg-surface-foreground/12')} />
      <span className="ml-2 text-[11px] uppercase tracking-[.18em] text-surface-foreground/50">
        Etapa {currentStep + 1} de 3
      </span>
    </div>
  )
}
