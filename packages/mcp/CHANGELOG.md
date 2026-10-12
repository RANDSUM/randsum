# @randsum/mcp

## 2.1.0

### Minor Changes

- [#1304](https://github.com/RANDSUM/randsum/pull/1304) [`8a382dd`](https://github.com/RANDSUM/randsum/commit/8a382ddf10d38a6c2fcbe35fdb7c7cbc580858a6) Thanks [@alxjrvs](https://github.com/alxjrvs)! - The `roll`, `validate` and `roll_game` tools now declare an output schema, so
  clients can rely on the shape of `structuredContent`. When a tool fails with a
  RANDSUM error, the result carries a second text block with the error `code`, and
  the `position` in the notation when there is one.

### Patch Changes

- [#1239](https://github.com/RANDSUM/randsum/pull/1239) [`78a8671`](https://github.com/RANDSUM/randsum/commit/78a8671c935700df31e3acec1549456790675a2e) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Raise the Blades in the Dark pool ceiling from 6 to 10.

  A Blades action roll routinely exceeds six dice at the table: an action rating
  of 3 plus two assists, a push, and a Devil's bargain is a legal ten-dice pool.
  The spec capped `rating` at 6, so those rolls threw a validation error instead
  of rolling.

  The zero-dice description also said "desperate", which named the wrong thing —
  Desperate is a _position_ in Blades, and you can roll zero dice from any
  position. It now describes what the branch actually does: roll two, take the
  worst.

- [#1303](https://github.com/RANDSUM/randsum/pull/1303) [`5081273`](https://github.com/RANDSUM/randsum/commit/5081273406944d17a3f6cab1f9636630dc8890c8) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Each game subpath now exports `inputs`, the spec's input declarations
  (type, minimum, maximum, default, enum, optional, description) as a const
  object, so a consumer can build a form or schema from the same ranges `roll()`
  validates against:

  ```ts
  import { inputs } from "@randsum/games/blades";
  inputs.rating.maximum; // 10
  ```

  The MCP `roll_game` tool now builds its `params` schema from those exports.
  Clients see one object schema per game with integer types, bounds, enums and
  the spec's descriptions, and `params` is checked against the chosen game. The
  old hand-written schema said the Blades rating was 0-4 (the spec allows 0-10),
  described the 5e `crit` flag as doubling dice (it checks for natural 1 and 20),
  and accepted fractional or unbounded numbers for `modifier` and `stat`.

- [#1301](https://github.com/RANDSUM/randsum/pull/1301) [`972a361`](https://github.com/RANDSUM/randsum/commit/972a3610348bbbff1cb567319a08e4bb363a6150) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Fix the root entry so `import { AVAILABLE_GAMES, SchemaError } from '@randsum/games'` loads.

  In 4.0.0, `dist/index.js` re-exported two bindings it never declared, so the
  import threw at module load in Node and Bun. The cause was the same bunup
  self-DCE bug that ADR-018 records for `@randsum/roller`: with `sideEffects:
false` in the package manifest, the build strips exported consts from shared
  chunks. The package now builds with `sideEffects: true` and flips it to `false`
  only in the published manifest, so consumers keep tree-shaking. The game
  subpaths and `./schema` were not affected.

- [#1304](https://github.com/RANDSUM/randsum/pull/1304) [`8a382dd`](https://github.com/RANDSUM/randsum/commit/8a382ddf10d38a6c2fcbe35fdb7c7cbc580858a6) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Notation and descriptions built from options now list modifiers in the order
  they run. Before, they used a separate hand-kept order that put drop and keep
  before replace, reroll and the explosions, and count after the arithmetic. For
  example, `roll('4d6L!').rolls[0].notation` is now `'4d6!L'`, and
  `validateNotation('4d6LR{1}+3').notation[0]` is `'4d6R{1}L+3'`. The dice roll
  the same way: modifiers have always run in priority order, whatever order the
  notation lists them in.

- [#1304](https://github.com/RANDSUM/randsum/pull/1304) [`8a382dd`](https://github.com/RANDSUM/randsum/commit/8a382ddf10d38a6c2fcbe35fdb7c7cbc580858a6) Thanks [@alxjrvs](https://github.com/alxjrvs)! - The lexer is now the only notation parser. The old regex parser that still
  built options for every standard pool is gone, and `roll()` parses each
  notation string once instead of three times.

  - `notationToOptions` throws `NotationParseError`, with `context.position`, on
    invalid notation. It used to return made-up options for input it could not
    parse. For example, `notationToOptions('0d0')` returned a zero-sided pool that
    only failed later inside `roll()`. Check with `isDiceNotation` first if you
    need to branch.
  - A trailing repeat followed by whitespace now repeats: `'4d6x3 '` gives three
    pools, as `'4d6x3'` does. Before, the `x3` was silently dropped.
  - `validateNotation` no longer throws on `g0`, `z0` and `DD0`, which
    `isDiceNotation` accepts. It returns a result for them like any other
    notation.
  - The repeat-depth error now quotes the whole notation, not the inner segment
    where the limit was hit.
  - Keep-middle now adds to an `L`/`H` drop instead of overwriting it: `5d6KmL`
    and `5d6LKm` both drop the two lowest and the highest. `6d6KKm` keeps both
    the highest and the middle, where keep-middle used to win. Other repeated
    modifiers are unchanged: `V`, `C`, `U`, `!{..}`, `*`, `//` and `%` still keep
    only their first occurrence (`4d6V{1=6}V{2=5}` replaces only 1s).

- [#1302](https://github.com/RANDSUM/randsum/pull/1302) [`0280991`](https://github.com/RANDSUM/randsum/commit/028099121181b193c369c2507fe9670ece43606f) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Modifiers on special dice now roll, and notation that used to pass validation
  and then crash or return a wrong total now behaves the same as its options form.

  - `4dF+1`, `d%+5`, `g6+1`, `z6+1`, `3DD6L` and `2d{1,2,3}+1` passed
    `isDiceNotation`, then `roll()` and `validateNotation()` threw an internal
    `Invalid notation "0d0+1"` error. Special dice now carry their modifiers, as
    RDN's `die-core *modifier` grammar requires.
  - An explosion that fires on the maximum face without a condition (`!`, `!!`,
    `!p`, `!s{}`, `!i`, `!r`, `W`) is now a parse error on `dF`, `zN` and
    `d{...}`, whose faces are not 1..N. Before, these crashed. Use a condition
    instead, as in `4dF!{>0}`.
  - A reroll value is checked against the die's own faces, so `z6R{0}`,
    `dF.2R{0}` and `3d{2,4,6}R{6}` roll, and `z6R{9}` throws `ModifierError`.
  - Notation strings now get the same modifier validation as options objects.
    `roll('1d6L')` and `roll('4d6L4')` used to return a total of 0 and
    `roll('3d6K5')` quietly kept all three dice. Each now throws `ModifierError`.
  - `//0` and `%0` are no longer valid notation (the RDN grammar requires a
    positive divisor), and `{ integerDivide: 0 }` or `{ modulo: 0 }` throws
    `ModifierError`. Both used to return a `NaN` total.
  - Game `integer` inputs now reject fractions with the game's own label. For
    example, Daggerheart `{ modifier: 0.5 }` used to return a fractional total.

## 2.0.0

### Major Changes

- [#1169](https://github.com/RANDSUM/randsum/pull/1169) [`42e6d92`](https://github.com/RANDSUM/randsum/commit/42e6d9256ea17b93bc7480bbce3de521ee14af6c) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Re-release of `@randsum/mcp` as a complete rewrite, superseding the pre-audit 1.x line already on npm. The server now exposes `roll`, `validate`, and `roll_game` tools built on `@randsum/roller` 4.x and `@randsum/games` 4.x (snake_case result strings), with seeded reproducibility via `@randsum/roller/random`. The package version is aligned above the existing 1.1.0 so `latest` moves forward, not backward.

## 0.1.0

### Minor Changes

- [#1152](https://github.com/RANDSUM/randsum/pull/1152) [`2110e9b`](https://github.com/RANDSUM/randsum/commit/2110e9b3e4630bb88ce8868951d45401422eea84) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Initial release of `@randsum/mcp` — a Model Context Protocol stdio server that
  exposes the RANDSUM dice ecosystem to AI agents. Ships the `randsum-mcp` binary
  and three tools:

  - **`roll`** — roll RANDSUM notation (e.g. `4d6L`, `2d20+5`) with an optional
    `seed` for deterministic results; returns the total, per-pool rolls, and a
    description.
  - **`validate`** — validate dice notation, returning a description when valid and
    a suggested fix when not.
  - **`roll_game`** — roll for a specific game system (`blades`, `daggerheart`,
    `fate`, `fifth`, `pbta`, `root-rpg`, `salvageunion`), interpreting the dice per
    that game.

### Patch Changes

- [#1158](https://github.com/RANDSUM/randsum/pull/1158) [`cba0564`](https://github.com/RANDSUM/randsum/commit/cba05643b8cc9c1fb4d0f97bf5ac70f66f369d3b) Thanks [@alxjrvs](https://github.com/alxjrvs)! - Replace the local seeded LCG in `src/rng.ts` with a re-export of
  `createSeededRandom` from `@randsum/roller/random`. The roller factory carries
  the same negative-seed normalization the MCP copy had, so seed sequences
  (including negative seeds) are unchanged.
