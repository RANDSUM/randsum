// Type-level tests for DiceNotation template literal validation.
// Run via `tsc --noEmit` — no runtime execution needed.

import type { DiceNotation } from '../../src/notation/types'
import type { RollArgument } from '../../src/types/core'

// ===== VALID DiceNotation (must NOT error) =====

// Core patterns
const _core1: DiceNotation = '4d6'
const _core2: DiceNotation = '1d20'
const _core3: DiceNotation = '100d100'
const _core4: DiceNotation = '4D6'

// Drop modifiers
const _dropL: DiceNotation = '4d6L'
const _dropH2: DiceNotation = '4d6H2'
const _dropCond: DiceNotation = '4d6D{>5}'

// Keep modifiers
const _keepK: DiceNotation = '4d6K'
const _keepK2: DiceNotation = '4d6K2'
const _keepKL2: DiceNotation = '4d6KL2'
const _keepKM: DiceNotation = '4d6KM'

// Explode family
const _explode: DiceNotation = '1d6!'
const _compound: DiceNotation = '1d6!!'
const _penetrate: DiceNotation = '1d6!p'
const _explodeCond: DiceNotation = '1d6!{>5}'

// Reroll
const _reroll: DiceNotation = '1d6R{<3}'
const _rerollOnce: DiceNotation = '1d6ro{1}'

// Cap, Replace, Unique
const _cap: DiceNotation = '1d20C{<1,>6}'
const _replace: DiceNotation = '1d6V{=1:6}'
const _unique: DiceNotation = '4d6U'

// Arithmetic
const _plus: DiceNotation = '1d20+5'
const _minus: DiceNotation = '1d20-3'
const _mult: DiceNotation = '4d6*2'
const _intDiv: DiceNotation = '4d6//2'

// Sort, Wild, Repeat, Label
const _sort: DiceNotation = '4d6sa'
const _wild: DiceNotation = '5d6W'
const _repeat: DiceNotation = '4d6Lx6'
const _label: DiceNotation = '1d20[fire]'

// Count family
const _count: DiceNotation = '4d6#{>=3}'
const _success: DiceNotation = '4d6S{3}'
const _failure: DiceNotation = '4d6F{1}'

// Combined modifiers
const _combined1: DiceNotation = '4d6L+5'
const _combined2: DiceNotation = '4d6!R{<2}'

// Multi-pool (addition creates valid DiceNotation via ArithMod + AnyMod${string})
const _multiPool1: DiceNotation = '1d20+1d6'
const _multiPool2: DiceNotation = '4d6L+2d8'

// ===== VALID RollArgument special dice (must NOT error) =====

const _fate: RollArgument = 'dF'
const _percentile: RollArgument = 'd%'
const _percentile3: RollArgument = '3d%'
const _geometric: RollArgument = 'g6'
const _draw: RollArgument = 'DD6'
const _zeroBias: RollArgument = 'z6'
const _customFaces: RollArgument = 'd{H,T}'

// ===== INVALID DiceNotation (must error) =====

// @ts-expect-error — plain text is not dice notation
const _bad1: DiceNotation = 'not-dice'
// @ts-expect-error — empty string is not dice notation
const _bad2: DiceNotation = ''
// @ts-expect-error — bare number string is not dice notation
const _bad3: DiceNotation = '42'
// @ts-expect-error — missing sides number
const _bad4: DiceNotation = '4d'
// @ts-expect-error — 'X' is not a valid modifier
const _bad5: DiceNotation = '4d6X'
// @ts-expect-error — no dice pattern at all
const _bad6: DiceNotation = 'hello'

// ===== INVALID RollArgument (must error) =====

// @ts-expect-error — arbitrary string is not a valid roll argument
const _badArg1: RollArgument = 'not-dice'
// @ts-expect-error — empty string is not a valid roll argument
const _badArg2: RollArgument = ''

// Suppress unused variable warnings
void [
  _core1,
  _core2,
  _core3,
  _core4,
  _dropL,
  _dropH2,
  _dropCond,
  _keepK,
  _keepK2,
  _keepKL2,
  _keepKM,
  _explode,
  _compound,
  _penetrate,
  _explodeCond,
  _reroll,
  _rerollOnce,
  _cap,
  _replace,
  _unique,
  _plus,
  _minus,
  _mult,
  _intDiv,
  _sort,
  _wild,
  _repeat,
  _label,
  _count,
  _success,
  _failure,
  _combined1,
  _combined2,
  _multiPool1,
  _multiPool2,
  _fate,
  _percentile,
  _percentile3,
  _geometric,
  _draw,
  _zeroBias,
  _customFaces,
  _bad1,
  _bad2,
  _bad3,
  _bad4,
  _bad5,
  _bad6,
  _badArg1,
  _badArg2
]
