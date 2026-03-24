/**
 * A single conformance test vector from the RANDSUM Dice Notation Specification.
 * Vectors are defined in vectors.ts and serialized to public/conformance/v<version>.json.
 *
 * Required fields are present on every vector.
 * Optional fields are present only when relevant to the vector's category.
 */
export interface ConformanceVector {
  /** Stable integer identifier. Must be unique across all vectors in a version. */
  readonly id: number
  /** The dice notation string under test. */
  readonly notation: string
  /**
   * Grouping category. Values in current v0.9.0 corpus:
   * 'dice_expressions' | 'stage1_modifiers' | 'stage2_modifiers' |
   * 'stage3_modifiers' | 'stage4_modifiers' | 'arithmetic_modifiers' |
   * 'error_cases'
   */
  readonly category: string
  /** Spec section reference (e.g. '4.1', '6.5.4'). */
  readonly section: string
  /** Minimum conformance level required to support this vector. */
  readonly conformanceLevel: number
  /**
   * The deterministic seed rolls injected into the roller for this vector.
   * Absent on error_cases vectors.
   */
  readonly seedRolls?: readonly number[]
  /** Expected dice pool after all modifiers. Absent on error_cases vectors. Null when indeterminate. */
  readonly expectedPool?: readonly (number | string)[] | null
  /** Expected total after all arithmetic. Absent on error_cases vectors. */
  readonly expectedTotal?: number | null
  /**
   * Extra rolls consumed during reroll resolution.
   * Present only when the roller must draw additional values beyond seedRolls.
   */
  readonly rerollRolls?: readonly number[]
  /** Extra rolls consumed during explode resolution. */
  readonly explodeRolls?: readonly number[]
  /** Extra rolls consumed during compound-explode resolution. */
  readonly compoundRolls?: readonly number[]
  /** Extra rolls consumed during penetrate resolution. */
  readonly penetrateRolls?: readonly number[]
  /**
   * Extra rolls for explode-sequence resolution (sequence die rolls).
   * Only present on explodeSequence vectors.
   */
  readonly sequenceRolls?: readonly number[]
  /**
   * Always `true` when present — indicates this vector expects an error.
   * The error type description is in `errorDescription`, not here.
   */
  readonly expectedError?: true
  /** Human-readable explanation for the expectedError. */
  readonly errorDescription?: string
  /** Freeform note for unusual vector behavior. */
  readonly note?: string
}

/** Top-level shape of the conformance JSON file. */
export interface ConformanceFile {
  readonly specVersion: string
  readonly generatedFrom: string
  readonly conformanceLevels: {
    readonly level1_core: readonly number[]
    readonly level2_vtt: readonly number[]
    readonly level3_extended: readonly number[]
    readonly level4_full: readonly number[]
    readonly errorCases: readonly number[]
  }
  readonly vectors: readonly ConformanceVector[]
}
