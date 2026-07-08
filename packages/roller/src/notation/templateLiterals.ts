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
 * - `${AnyMod}${string}` — two or more modifiers (graceful widening)
 *
 * Note: `${AnyMod}${AnyMod}` would be more precise for two modifiers, but
 * the cross-product of all modifier patterns causes TypeScript to compute a
 * union too large for practical compilation. Single-modifier precision catches
 * the most common case; multi-modifier widens to string after the first.
 */
export type ModifierSuffix = '' | AnyMod | `${AnyMod}${string}`
