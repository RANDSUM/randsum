import { useEffect, useRef, useState } from 'react'
import { validateNotation } from '@randsum/roller'

interface UseValidationResult {
  readonly validationError: string
}

export function useValidation(input: string): UseValidationResult {
  const [validationError, setValidationError] = useState('')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current)
    }

    if (input.trim() === '') {
      setValidationError('')
      return
    }

    timeoutRef.current = setTimeout(() => {
      const result = validateNotation(input.trim())
      if (!result.valid) {
        setValidationError(result.error.message)
      } else {
        setValidationError('')
      }
    }, 300)

    return () => {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [input])

  return { validationError }
}
