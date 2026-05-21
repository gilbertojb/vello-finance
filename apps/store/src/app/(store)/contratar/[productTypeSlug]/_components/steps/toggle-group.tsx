'use client'

type Props = {
  options: readonly string[]
  value: string
  onChange: (v: string) => void
}

export function ToggleGroup({ options, value, onChange }: Props) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-surface-foreground/15 bg-white">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            value === opt
              ? 'bg-surface-foreground text-surface'
              : 'text-surface-foreground/50 hover:text-surface-foreground'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
