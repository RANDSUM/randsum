import type { RollResult } from '@randsum/dice-ui'

// ---- Types ----

export interface PlaygroundState {
  readonly notation: string
  readonly rollResult: RollResult | null
  readonly selectedEntry: string | null
  readonly rolling: boolean
  readonly suggestion: string | null
}

// ---- Pure state transition helpers ----

export function buildInitialState(initialNotation: string | null): PlaygroundState {
  return {
    notation: initialNotation ?? '',
    rollResult: null,
    selectedEntry: null,
    rolling: false,
    suggestion: null
  }
}

export function applyEscape(prev: PlaygroundState): PlaygroundState {
  return { ...prev, rollResult: null, selectedEntry: null, rolling: false, suggestion: null }
}

export function applyRolling(prev: PlaygroundState): PlaygroundState {
  return { ...prev, rolling: true }
}

export function applyRollResult(prev: PlaygroundState, result: RollResult): PlaygroundState {
  return { ...prev, rollResult: result, rolling: false }
}

export function applySuggestion(prev: PlaygroundState, suggestion: string | null): PlaygroundState {
  return { ...prev, suggestion }
}

/**
 * Computes a notation fix suggestion. Accepts the fixer as a parameter
 * so the roller dependency can be injected and the function stays testable
 * without requiring a built dist of @randsum/roller.
 */
export function computeSuggestion(
  notation: string,
  fixer: (s: string) => string | undefined
): string | null {
  return fixer(notation) ?? null
}
