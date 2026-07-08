// Type-level tests for the AnyMod / ModifierSuffix template literal unions.
// Run via `tsc --noEmit` — no runtime execution needed.

import type { AnyMod, ModifierSuffix } from '../../src/notation/templateLiterals'

// ===== Valid single modifiers (must NOT error) =====

const _dropL: AnyMod = 'L'
const _dropH2: AnyMod = 'H2'
const _keepKL: AnyMod = 'KL'
const _keepKL3: AnyMod = 'KL3'
const _explode: AnyMod = '!'
const _compound: AnyMod = '!!'
const _penetrate: AnyMod = '!P'
const _reroll: AnyMod = 'R{<3}'
const _rerollOnce: AnyMod = 'ro{1}'
const _cap: AnyMod = 'C{<1,>6}'
const _replace: AnyMod = 'V{=1:6}'
const _unique: AnyMod = 'U'
const _uniqueCond: AnyMod = 'U{1,2}'
const _count: AnyMod = '#{>=3}'
const _success: AnyMod = 'S{3}'
const _failure: AnyMod = 'F{1}'
const _plus: AnyMod = '+5'
const _minus: AnyMod = '-3'
const _mult: AnyMod = '*2'
const _power: AnyMod = '**2'
const _intDiv: AnyMod = '//2'
const _modulo: AnyMod = '%3'
const _margin: AnyMod = 'ms{10}'
const _sortAsc: AnyMod = 'sa'
const _sortDesc: AnyMod = 'SD'
const _wild: AnyMod = 'W'
const _repeat: AnyMod = 'x6'
const _label: AnyMod = '[fire]'
const _dropCond: AnyMod = 'D{>5}'
const _keepM: AnyMod = 'KM2'
const _explodeCond: AnyMod = '!{>5}'
const _compoundCond: AnyMod = '!!{>5}'
const _penetrateCond: AnyMod = '!P{>5}'
const _explodeSeq: AnyMod = '!s{6,8,10}'

// ===== Valid modifier suffixes (must NOT error) =====

const _empty: ModifierSuffix = ''
const _single: ModifierSuffix = 'L'
const _double: ModifierSuffix = 'L+5'
const _triple: ModifierSuffix = 'L+5[damage]'

// ===== Invalid — these must error =====

// @ts-expect-error — 'X' alone is not a valid modifier
const _badMod: AnyMod = 'X'
// @ts-expect-error — bare 'G' is not a modifier
const _badMod2: AnyMod = 'G'
// @ts-expect-error — 'GARBAGE' is not a valid modifier
const _badSuffix: AnyMod = 'GARBAGE'

// Suppress unused variable warnings
void [
  _dropL,
  _dropH2,
  _keepKL,
  _keepKL3,
  _explode,
  _compound,
  _penetrate,
  _reroll,
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
  _dropCond,
  _keepM,
  _explodeCond,
  _compoundCond,
  _penetrateCond,
  _explodeSeq,
  _empty,
  _single,
  _double,
  _triple,
  _badMod,
  _badMod2,
  _badSuffix
]
