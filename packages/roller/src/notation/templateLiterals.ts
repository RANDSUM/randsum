// Template literal types for dice notation modifier validation.
// Each modifier type is a union of valid notation patterns for that modifier.
// ModifierSuffix is tiered: precise for 1-2 modifiers, catch-all for 3+.

/** Drop modifiers: L, H, L2, H3, D{...}, d{...} */
type DropMod =
  | 'L'
  | 'l'
  | 'H'
  | 'h'
  | `${'L' | 'l'}${number}`
  | `${'H' | 'h'}${number}`
  | `${'D' | 'd'}{${string}}`

/** Keep modifiers: K, K2, KL, KL2, KM, KM2 */
type KeepMod =
  | 'K'
  | 'k'
  | `${'K' | 'k'}${number}`
  | `${'K' | 'k'}${'L' | 'l'}${number | ''}`
  | `${'K' | 'k'}${'M' | 'm'}${number | ''}`

/** Explode family: !, !!, !p, !P, !i, !r, !s{...}, !{...} */
type ExplodeMod =
  | '!'
  | '!!'
  | `!${number}`
  | `!!${number}`
  | '!p'
  | '!P'
  | '!i'
  | '!I'
  | '!r'
  | '!R'
  | `!{${string}}`
  | `!!{${string}}`
  | `!${'p' | 'P'}{${string}}`
  | `!${'s' | 'S'}{${string}}`

/** Reroll: R{...}, R{...}N, ro{...} */
type RerollMod =
  | `${'R' | 'r'}{${string}}`
  | `${'R' | 'r'}{${string}}${number}`
  | `${'R' | 'r'}${'o' | 'O'}{${string}}`

/** Cap: C{...} */
type CapMod = `${'C' | 'c'}{${string}}`

/** Replace/Map: V{...} */
type ReplaceMod = `${'V' | 'v'}{${string}}`

/** Unique: U, U{...} */
type UniqueMod = 'U' | 'u' | `${'U' | 'u'}{${string}}`

/** Count: #{...}, S{...}, F{...} */
type CountMod = `#{${string}}` | `${'S' | 's'}{${string}}` | `${'F' | 'f'}{${string}}`

/** Arithmetic: +N, -N, *N, **N, //N, %N, ms{N} */
type ArithMod =
  | `+${number}`
  | `-${number}`
  | `*${number}`
  | `**${number}`
  | `//${number}`
  | `%${number}`
  | `${'m' | 'M'}${'s' | 'S'}{${number}}`

/** Sort: sa, sd (case-insensitive) */
type SortMod = `${'s' | 'S'}${'a' | 'A'}` | `${'s' | 'S'}${'d' | 'D'}`

/** Wild die */
type WildMod = 'W' | 'w'

/** Repeat: xN (end-of-notation only) */
type RepeatMod = `${'x' | 'X'}${number}`

/** Label/annotation: [text] */
type LabelMod = `[${string}]`

/** Union of all single modifier patterns */
export type AnyMod =
  | DropMod
  | KeepMod
  | ExplodeMod
  | RerollMod
  | CapMod
  | ReplaceMod
  | UniqueMod
  | CountMod
  | ArithMod
  | SortMod
  | WildMod
  | RepeatMod
  | LabelMod

/**
 * Tiered modifier suffix for DiceNotation:
 * - '' — no modifiers
 * - AnyMod — exactly one modifier (precise)
 * - AnyMod + AnyMod — exactly two modifiers (precise)
 * - AnyMod + AnyMod + string — three or more (graceful widening)
 */
export type ModifierSuffix = '' | AnyMod | `${AnyMod}${AnyMod}` | `${AnyMod}${AnyMod}${string}`

// ===== Type-level smoke tests =====

// Valid single modifiers
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

// Valid modifier suffixes
const _empty: ModifierSuffix = ''
const _single: ModifierSuffix = 'L'
const _double: ModifierSuffix = 'L+5'
const _triple: ModifierSuffix = 'L+5[damage]'

// Invalid — these must error
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
