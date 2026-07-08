// Re-export the public deterministic-queue RNG from the roller's ./random module
// so tests and consumers share a single implementation.
export { createQueueRandom, type QueueRandomOptions } from '../../src/random'
