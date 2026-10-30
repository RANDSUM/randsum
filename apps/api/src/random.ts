/** Largest `count` one `/v1/random` request may ask for. */
export const MAX_COUNT = 1000

/** Widest range one request may span: every value a single Uint32 draw can pick. */
const MAX_SPAN = 2 ** 32

/** A request for `count` integers drawn uniformly from `min..max`, inclusive. */
export interface RandomIntRequest {
  readonly min: number
  readonly max: number
  readonly count: number
}

/** Fills a buffer with random 32-bit words. `crypto.getRandomValues` in production. */
export type WordSource = (words: Uint32Array) => void

const cryptoWords: WordSource = words => {
  crypto.getRandomValues(words)
}

/**
 * Checks a request's bounds, returning why it is unusable or `undefined` when
 * it can be served.
 */
export function randomIntProblem({ min, max, count }: RandomIntRequest): string | undefined {
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) {
    return '"min" and "max" must be integers.'
  }
  if (min > max) return '"min" must not be greater than "max".'
  if (max - min + 1 > MAX_SPAN) return `The range "min".."max" may span at most ${MAX_SPAN} values.`
  if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) {
    return `"count" must be an integer from 1 to ${MAX_COUNT}.`
  }
  return undefined
}

/**
 * Draws `count` integers uniformly from `min..max`, inclusive, from a
 * cryptographic source. Rejection sampling discards the top sliver of the
 * 32-bit space that does not divide evenly by the span, so no value is
 * favoured the way `word % span` would favour the low ones.
 *
 * The caller checks the request with {@link randomIntProblem} first.
 */
export function randomInts(
  { min, max, count }: RandomIntRequest,
  fill: WordSource = cryptoWords
): readonly number[] {
  const span = max - min + 1
  const limit = MAX_SPAN - (MAX_SPAN % span)
  const draw = (accepted: readonly number[]): readonly number[] => {
    if (accepted.length >= count) return accepted.slice(0, count)
    const words = new Uint32Array(count - accepted.length)
    fill(words)
    const fresh = Array.from(words)
      .filter(word => word < limit)
      .map(word => min + (word % span))
    return draw([...accepted, ...fresh])
  }
  return draw([])
}
