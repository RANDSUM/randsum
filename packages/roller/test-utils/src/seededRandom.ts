// Re-export the public seeded RNG from the roller's ./random module so tests and
// consumers share a single implementation.
export { createSeededRandom } from '../../src/random'
