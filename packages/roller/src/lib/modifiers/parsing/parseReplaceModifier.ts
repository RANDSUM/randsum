import type { ModifierOptions } from '../../../types'
import { replacePattern } from '../../patterns/modifierPatterns'

export function parseReplaceModifier(notation: string): Pick<ModifierOptions, 'replace'> {
  const match = notation.match(replacePattern)
  if (!match) return {}

  const content = match[1]
  if (!content) return {}
  const parts = content.split(',').map(s => s.trim())

  const replacements = parts.map(part => {
    const [fromPart, toPart] = part.split('=')
    if (!fromPart || !toPart) return { from: 0, to: 0 }

    let from: number | { greaterThan: number } | { lessThan: number }
    if (fromPart.startsWith('>')) {
      from = { greaterThan: Number(fromPart.slice(1)) }
    } else if (fromPart.startsWith('<')) {
      from = { lessThan: Number(fromPart.slice(1)) }
    } else {
      from = Number(fromPart)
    }

    return { from, to: Number(toPart) }
  })

  return { replace: replacements }
}
