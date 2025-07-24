import type { ModifierOptions } from '../../types'
import { parseArithmeticModifiers } from './parsing/parseArithmeticModifiers'
import { parseCapModifier } from './parsing/parseCapModifier'
import { parseDropModifiers } from './parsing/parseDropModifiers'
import { parseExplodeModifier } from './parsing/parseExplodeModifier'
import { parseReplaceModifier } from './parsing/parseReplaceModifier'
import { parseRerollModifier } from './parsing/parseRerollModifier'
import { parseUniqueModifier } from './parsing/parseUniqueModifier'

export function parseModifiers(notation: string): ModifierOptions {
  return {
    ...parseDropModifiers(notation),
    ...parseExplodeModifier(notation),
    ...parseUniqueModifier(notation),
    ...parseReplaceModifier(notation),
    ...parseRerollModifier(notation),
    ...parseCapModifier(notation),
    ...parseArithmeticModifiers(notation)
  }
}
