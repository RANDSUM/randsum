/**
 * The accent palette and outcome glyphs — the bot's whole visual vocabulary.
 *
 * Before this file the colours were fourteen inline literals across eight
 * command files, drawn from three unrelated sources: saturated RGB primaries
 * (`0x00ff00`), the Flat-UI set (`0x2ecc71`), and CSS named colours
 * (`dodgerblue`). Two consequences worth remembering, because both were live
 * bugs in the output rather than untidiness:
 *
 * - Green meant two different greens. Root's strong hit was `0x00ff00` and
 *   Fate's Great was `0x2ecc71` — the same semantic tier, visibly different.
 * - Failure was indistinguishable from a crash. A missed `/root` roll and a
 *   validation error both rendered `0xff0000`.
 *
 * And gold meant nothing in particular: it was the critical accent for five
 * commands, the chrome for `/help` and `/notation`, and the unconditional
 * colour of `/roll`, so the bot's most common output was permanently dressed as
 * a critical success.
 *
 * Two layers now. **Outcome tier** picks the accent within a game, so a
 * player reads success-versus-failure before reading any text. **System
 * identity** picks which green, so a Blades success and a Root success are both
 * green without being the same green.
 *
 * Every value clears Discord's dark-theme ground (`#313338`). That rules out
 * some tonally correct choices — Blades' soot-and-gaslight palette is
 * represented by its accents rather than its near-black ground, which would
 * simply disappear.
 */

/**
 * Outcome glyphs, which carry the same signal as the accent without relying on
 * colour.
 *
 * Roughly 8% of men have a red/green deficiency, which is a real slice of any
 * TTRPG server, and Discord's accent bar is 4px of hue with no label. These are
 * shape-differentiated so they survive greyscale, and they are plain text — no
 * custom emoji to host, no per-platform rendering differences.
 */
export const GLYPH = {
  /** Best possible: a Blades critical, a natural 20, a Daggerheart crit. */
  critical: '✸',
  /** Unqualified success. */
  success: '◆',
  /** Success with a cost, a partial, a weak hit — the middle band. */
  mixed: '◈',
  /** Failure or a miss. */
  failure: '✕',
  /** The worst case, reserved for a natural 1. */
  fumble: '☠'
} as const

/** Blades in the Dark — grimy industrial-occult: brass, ghost-fire, dried blood. */
export const BLADES = {
  critical: 0xe8c547,
  success: 0x4fb3a5,
  partial: 0xc9762f,
  failure: 0x8b1e1e
} as const

/** Daggerheart — gold Hope against deep-violet Fear, the game's own language. */
export const DAGGERHEART = {
  critical: 0xffce45,
  /** Deliberately dimmer than `critical`, so a crit reads as *more*. */
  hope: 0xd99a2b,
  fear: 0x5b2c8d
} as const

/** PbtA — no fictional palette to borrow, so a clean semantic ramp. */
export const PBTA = {
  strongHit: 0x2f9e6b,
  weakHit: 0xd9822b,
  miss: 0xc0392b
} as const

/** Root — Ferrin's storybook woodland: green, Marquise orange, deep berry. */
export const ROOT = {
  strongHit: 0x4a7c3f,
  weakHit: 0xc97b2b,
  miss: 0x6b2737
} as const

/** D&D 5e — PHB red and brass, rather than the generic web blue it had. */
export const FIFTH = {
  natural20: 0xe8b44a,
  standard: 0xb01b2e,
  natural1: 0x7a1418
} as const

/**
 * Fate — the existing six-step ramp, which was already the right instinct.
 * Only the hexes are retuned; the shape of the ramp is unchanged.
 */
export const FATE = {
  legendary: 0xf2c14e,
  great: 0x3fa46a,
  good: 0x3e8fc1,
  average: 0x8e9aa3,
  poor: 0xd2812f,
  terrible: 0xb03a3a
} as const

/** `/roll` and the informational commands. Brand identity, not an outcome. */
export const BRAND = 0x7c3aed

/**
 * Errors. Deliberately distinct from every failure accent above: the embed
 * version shared `0xff0000` with three commands' failure colour, so a missed
 * roll and a validation crash were indistinguishable.
 */
export const ERROR = 0x992d22
