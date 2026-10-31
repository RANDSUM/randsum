/**
 * A single conformance test vector from the RANDSUM Dice Notation Specification
 * (Section 11.3). The vectors live in `vectors/v<version>.json`, which is the source
 * of truth; `schema/conformance.schema.json` describes the same shape.
 *
 * Required fields are present on every vector.
 * Optional fields are present only when relevant to the vector's category.
 */
export interface ConformanceVector {
  /** Stable integer identifier. Unique across all vectors in a version. */
  readonly id: number
  /** The dice notation string under test. */
  readonly notation: string
  /** Grouping category, such as 'dice_expressions' or 'error_cases'. */
  readonly category: string
  /** Spec section reference (e.g. '4.1', '6.5.4'). */
  readonly section: string
  /** Lowest conformance level that requires this vector. */
  readonly conformanceLevel: number
  /** The die values the initial pool rolls. Absent on error vectors. */
  readonly seedRolls?: readonly number[]
  /** Expected dice pool after all modifiers. Absent on error vectors. Null when indeterminate. */
  readonly expectedPool?: readonly (number | string)[] | null
  /** Expected total after all arithmetic. Absent on error vectors. Null when there is none. */
  readonly expectedTotal?: number | null
  /** Values consumed by rerolls, after `seedRolls`. */
  readonly rerollRolls?: readonly number[]
  /** Values consumed by explosions, after `rerollRolls`. */
  readonly explodeRolls?: readonly number[]
  /** Values consumed by compounding explosions, after `explodeRolls`. */
  readonly compoundRolls?: readonly number[]
  /** Values consumed by penetrating explosions, after `compoundRolls`. */
  readonly penetrateRolls?: readonly number[]
  /** Values on each explode-sequence die, last; each is the value on its own die. */
  readonly sequenceRolls?: readonly number[]
  /** Always `true` when present: the implementation MUST reject the notation. */
  readonly expectedError?: true
  /** Human-readable explanation for the expected error. */
  readonly errorDescription?: string
  /** Freeform note for unusual vector behavior. */
  readonly note?: string
  /**
   * What the result must satisfy when an implementation cannot replay `seedRolls`
   * (custom faces and draw dice depend on how it maps random numbers to faces
   * and shuffles): the pool has the expected size, every value is one of `faces`,
   * and with `distinct` no value repeats.
   */
  readonly unseeded?: {
    readonly faces: readonly (number | string)[]
    readonly distinct?: boolean
  }
}

/** The vector ids each conformance level requires (Section 10). */
export interface ConformanceLevels {
  readonly level1_core: readonly number[]
  readonly level2_vtt: readonly number[]
  readonly level3_extended: readonly number[]
  readonly level4_full: readonly number[]
  readonly errorCases: readonly number[]
}

/** Top-level shape of a conformance vectors file. */
export interface ConformanceFile {
  readonly $schema?: string
  readonly $id?: string
  readonly specVersion: string
  readonly conformanceLevels: ConformanceLevels
  readonly vectors: readonly ConformanceVector[]
}
