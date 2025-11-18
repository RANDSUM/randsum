import { coreNotationPattern } from './lib/patterns'

/**
 * Lightweight, regex‑based validation used by tests to quickly check whether
 * a value looks like supported dice notation. Parsing is handled separately.
 */
export function isDiceNotation(value: unknown): value is string {
  if (typeof value !== 'string') return false

  const trimmed = value.trim()
  if (!trimmed) return false

  const notation = trimmed.replace(/\s+/g, '')

  // Disallow obvious invalid characters early
  if (/[^0-9dD+\-LRHCURVD!{}<>,=]/.test(notation)) return false

  // Disallow decimals
  if (notation.includes('.')) return false

  // Basic core dice check
  if (!coreNotationPattern.test(notation)) return false

  const singlePattern =
    /^[+-]?\d+[dD]\d+(?:[LH]\d*|D\{[^}]+\}|C\{[^}]+\}|R\{[^}]+\}\d*|U(?:\{[^}]+\})?|V\{[^}]+\}|!|[+-]\d+)*$/

  const multiPattern =
    /^[+-]?\d+[dD]\d+(?:[LH]\d*|D\{[^}]+\}|C\{[^}]+\}|R\{[^}]+\}\d*|U(?:\{[^}]+\})?|V\{[^}]+\}|!)*(?:[+-]\d+[dD]\d+(?:[LH]\d*|D\{[^}]+\}|C\{[^}]+\}|R\{[^}]+\}\d*|U(?:\{[^}]+\})?|V\{[^}]+\}|!)*)*$/

  return singlePattern.test(notation) || multiPattern.test(notation)
}



