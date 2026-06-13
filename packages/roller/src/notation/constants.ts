/**
 * The standard TTRPG die sizes, in ascending order.
 * Used by inflation (!i) and reductive (!r) explosion sugar.
 */
export const TTRPG_STANDARD_DIE_SET: readonly number[] = Object.freeze([4, 6, 8, 10, 12, 20, 100])

/**
 * Canonical raw regex fragments for each special die-type marker — the die-type segment WITHOUT
 * a quantity prefix, sign, anchors, or capture groups. Consumers (isDiceNotation, tokenize,
 * parseSpecialPool) compose these with their own prefixes/anchors/capture groups so the die-type
 * shapes live in exactly one place. Kept in sync with consumers by
 * __tests__/notation/dieMarkers.crosscheck.test.ts.
 */
export const DIE_MARKER_PERCENTILE = '[Dd]%'
export const DIE_MARKER_FATE = '[Dd][Ff](?:\\.[12])?'
export const DIE_MARKER_CUSTOM_FACES = '[Dd]\\{[^}]+\\}'
export const DIE_MARKER_DRAW = '[Dd][Dd]\\d+'
export const DIE_MARKER_GEOMETRIC = '[Gg]\\d+'
export const DIE_MARKER_ZERO_BIAS = '[Zz]\\d+'
