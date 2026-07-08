// Quantity is optional per RDN §4.1 (`standard-die = [quantity] %i"d" positive-integer`):
// a bare `dN` de-aliases to `1dN` (e.g. `d20` === `1d20`). Sides remain mandatory.
//
// The bare (quantity-less) form is constrained to pool boundaries — the start of
// the string, or immediately after a +/- sign — because RDN only permits an
// additional pool via a signed `mod-add-pool` (§P4). Without this guard a bare
// `dN` matches mid-token, so separator-less concatenations like `4d6d6` or the
// `D6` inside a draw die's `DD6` marker parse as spurious extra pools instead of
// throwing. Three alternatives, tried in order:
//   1. quantity present (sign optional): `4d6`, `-2d6`, a signed `+3d4` pool
//   2. bare `dN` after a required sign: `+d6`, `-d20`
//   3. bare `dN` only at string start (never preceded by any character): `d20`
export const coreNotationPattern: RegExp =
  /[+-]?[1-9]\d*[Dd][1-9]\d*|[+-][Dd][1-9]\d*|(?<![\s\S])[Dd][1-9]\d*/ satisfies RegExp
