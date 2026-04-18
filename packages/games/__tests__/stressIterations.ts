/**
 * Iteration count for stress tests that deterministically exercise rare code paths.
 * With a d20, P(never hitting a specific value in 9999 rolls) = (19/20)^9999 ≈ 0.
 * Do not reduce without replacing with seeded/property-based coverage.
 */
export const STRESS_ITERATIONS = 9999
