import { useEffect, useRef, useState } from 'react'
import { validateNotation } from '@randsum/roller'

interface UseValidationResult {
  readonly validationError: string | null
}

export function useValidation(input: string): UseValidationResult {
  const [validationError, setValidationError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    if (input.trim() === '') {
      setValidationError(null)
      return
    }

    timerRef.current = setTimeout(() => {
      const result = validateNotation(input.trim())
      if (!result.valid) {
        setValidationError(result.error.message)
      } else {
        setValidationError(null)
      }
    }, 300)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [input])

  return { validationError }
}
