// Basic core dice pattern – matches substrings like "1d6", "2D20", "999d999".
// We deliberately do not anchor the pattern so `.test` works on strings that
// contain additional notation (e.g. "1d6+3").
export const coreNotationPattern = /\d+d\d+/i

// Complete roll pattern – used only by tests to verify behaviour, not by the
// parser itself. It is intentionally conservative and focused on performance.
//
// It tokenises:
// - core dice segments:  "1d6", "2d20"
// - arithmetic:          "+3", "-2"
// - simple drop tags:    "L", "L2", "H", "H2"
export const completeRollPattern =
  /(\d+d\d+|[+-]\d+|[LlHh]\d+\b|[LlHh]\b)/g


