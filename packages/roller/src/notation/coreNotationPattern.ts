// Quantity is optional per RDN §4.1 (`standard-die = [quantity] %i"d" positive-integer`):
// a bare `dN` de-aliases to `1dN` (e.g. `d20` === `1d20`). Sides remain mandatory.
export const coreNotationPattern: RegExp = /[+-]?(?:[1-9]\d*)?[Dd][1-9]\d*/ satisfies RegExp
