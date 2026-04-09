import type { SubmitEvent } from 'react'
import { useState, useTransition } from 'react'

type FormFieldError = { message?: string }

interface ActionState {
  success: boolean
  message: string | null
  errors: Record<string, string[]> | null
  data?: Record<string, unknown>
}

export interface FormState {
  success: boolean
  message: string | null
  errors: Record<string, FormFieldError[]> | null
  data?: Record<string, unknown>
}

function toFormErrors(
  errors: Record<string, string[]> | null,
): Record<string, FormFieldError[]> | null {
  if (!errors) return null

  return Object.fromEntries(
    Object.entries(errors).map(([key, messages]) => [
      key,
      messages.map((message) => ({ message })),
    ]),
  )
}

export function useFormState(
  action: (data: FormData) => Promise<ActionState>,
  onSuccess?: () => Promise<void> | void,
  onError?: (message: string) => Promise<void> | void,
  initialState?: FormState,
) {
  const [isPending, startTransition] = useTransition()

  const [formState, setFormState] = useState(
    initialState ?? { success: false, message: null, errors: null },
  )

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const data = new FormData(form)

    startTransition(async () => {
      const actionResult = await action(data)

      const state: FormState = {
        ...actionResult,
        errors: toFormErrors(actionResult.errors),
      }

      if (state.success && onSuccess) {
        await onSuccess()
      }

      if (!state.success && state.message && onError) {
        await onError(state.message)
      }

      setFormState(state)
    })
  }

  return [formState, handleSubmit, isPending] as const
}
