/**
 * Type-level tests for the strict DiceNotation template literal type.
 *
 * Valid notations must compile. Invalid notations use @ts-expect-error to
 * assert they are rejected at the type level. If this file compiles with
 * tsc --noEmit, the type constraints are working correctly.
 */
import type { DiceNotation } from '../../src/notation/types'

// =====================================================================
// VALID: bare NdN (no modifiers)
// =====================================================================
const _bare: DiceNotation = '1d6'
const _multiDie: DiceNotation = '4d6'
const _upperD: DiceNotation = '2D20'
const _d100: DiceNotation = '1d100'

// =====================================================================
// VALID: single modifiers
// =====================================================================

// Drop
const _dropL: DiceNotation = '4d6L'
const _dropH: DiceNotation = '4d6H'
const _dropL2: DiceNotation = '4d6L2'
const _dropH3: DiceNotation = '5d6H3'
const _dropCond: DiceNotation = '4d6D{>5}'
const _dropLower: DiceNotation = '4d6l'

// Keep
const _keepK: DiceNotation = '4d6K'
const _keepK3: DiceNotation = '4d6K3'
const _keepKL: DiceNotation = '4d6KL'
const _keepKL3: DiceNotation = '4d6KL3'
const _keepKM: DiceNotation = '4d6KM'
const _keepKM2: DiceNotation = '4d6KM2'

// Explode
const _explode: DiceNotation = '1d6!'
const _compound: DiceNotation = '1d6!!'
const _explodeN: DiceNotation = '1d6!6'
const _penetrate: DiceNotation = '1d6!P'
const _penetrateLower: DiceNotation = '1d6!p'
const _explodeCond: DiceNotation = '1d6!{>5}'
const _compoundCond: DiceNotation = '1d6!!{>5}'
const _penetrateCond: DiceNotation = '1d6!P{>5}'
const _explodeSeq: DiceNotation = '1d6!s{6,8,10}'

// Reroll
const _reroll: DiceNotation = '3d6R{<3}'
const _rerollMax: DiceNotation = '3d6R{<3}2'
const _rerollOnce: DiceNotation = '3d6ro{1}'

// Cap
const _cap: DiceNotation = '4d6C{<1,>6}'

// Replace
const _replace: DiceNotation = '4d6V{=1:6}'

// Unique
const _unique: DiceNotation = '4d6U'
const _uniqueCond: DiceNotation = '4d6U{1,2}'

// Count
const _count: DiceNotation = '5d6#{>=3}'
const _success: DiceNotation = '5d10S{3}'
const _failure: DiceNotation = '5d10F{3}'

// Arithmetic
const _plus: DiceNotation = '1d20+5'
const _minus: DiceNotation = '1d20-3'
const _mult: DiceNotation = '2d6*2'
const _power: DiceNotation = '2d6**2'
const _intDiv: DiceNotation = '2d6//2'
const _modulo: DiceNotation = '2d6%3'
const _margin: DiceNotation = '1d20ms{10}'

// Sort
const _sortAsc: DiceNotation = '4d6sa'
const _sortDesc: DiceNotation = '4d6SD'

// Wild die
const _wild: DiceNotation = '5d6W'

// Repeat
const _repeat: DiceNotation = '4d6x6'

// Label
const _label: DiceNotation = '2d6[fire]'

// =====================================================================
// VALID: multiple modifiers (widens after first)
// =====================================================================
const _dropPlus: DiceNotation = '4d6L+5'
const _dropPlusLabel: DiceNotation = '4d6L+5[damage]'
const _explodeReroll: DiceNotation = '3d6!R{<2}'
const _keepSort: DiceNotation = '4d6K3sa'

// =====================================================================
// VALID: case-insensitive
// =====================================================================
const _lowerD: DiceNotation = '4d6'
const _upperD2: DiceNotation = '4D6'
const _lowerK: DiceNotation = '4d6k3'

// =====================================================================
// INVALID: should fail type checking
// =====================================================================

// Not NdN pattern at all
// @ts-expect-error — bare string is not DiceNotation
const _badStr: DiceNotation = 'hello'

// @ts-expect-error — missing quantity
const _noQty: DiceNotation = 'd6'

// @ts-expect-error — missing sides
const _noSides: DiceNotation = '4d'

// @ts-expect-error — empty string
const _empty: DiceNotation = ''

// @ts-expect-error — special die types are not DiceNotation (they have their own types)
const _fate: DiceNotation = 'dF'

// @ts-expect-error — percentile is its own type
const _percentile: DiceNotation = 'd%'

// @ts-expect-error — single invalid modifier letter
const _badMod: DiceNotation = '4d6X'

// @ts-expect-error — 'G' alone is not a modifier (geometric is its own type)
const _badModG: DiceNotation = '4d6G'

// @ts-expect-error — random garbage suffix
const _garbage: DiceNotation = '4d6GARBAGE'

// @ts-expect-error — number alone
const _num: DiceNotation = '20'

// Suppress unused variable warnings
void [
  _bare,
  _multiDie,
  _upperD,
  _d100,
  _dropL,
  _dropH,
  _dropL2,
  _dropH3,
  _dropCond,
  _dropLower,
  _keepK,
  _keepK3,
  _keepKL,
  _keepKL3,
  _keepKM,
  _keepKM2,
  _explode,
  _compound,
  _explodeN,
  _penetrate,
  _penetrateLower,
  _explodeCond,
  _compoundCond,
  _penetrateCond,
  _explodeSeq,
  _reroll,
  _rerollMax,
  _rerollOnce,
  _cap,
  _replace,
  _unique,
  _uniqueCond,
  _count,
  _success,
  _failure,
  _plus,
  _minus,
  _mult,
  _power,
  _intDiv,
  _modulo,
  _margin,
  _sortAsc,
  _sortDesc,
  _wild,
  _repeat,
  _label,
  _dropPlus,
  _dropPlusLabel,
  _explodeReroll,
  _keepSort,
  _lowerD,
  _upperD2,
  _lowerK,
  _badStr,
  _noQty,
  _noSides,
  _empty,
  _fate,
  _percentile,
  _badMod,
  _badModG,
  _garbage,
  _num
]
