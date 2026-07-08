// The seeded RNG now lives in `@randsum/roller/random`. Re-export it so existing
// imports (`./rng`) keep working while the implementation is shared with the
// roller and CLI. The roller's `createSeededRandom` normalizes the LCG modulo,
// so negative seeds still produce valid dice faces.
export { createSeededRandom } from '@randsum/roller/random'
