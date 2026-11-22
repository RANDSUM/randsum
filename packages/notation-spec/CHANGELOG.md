# @randsum/notation-spec

Package releases are added above this line. Specification revisions are listed in Section 1.5 of the spec and below.

## Specification revisions

- **0.9.0 rev. 7** (2026-11-22): the items the rev. 6 audit left open. A repeated notation has vectors: `expectedResults` on a vector and `results` from an adapter hold each evaluation's pool and total (11.3), with vectors 106 and 107. Count's deduct mode rejects any pair of conditions that makes a value both a success and a failure (6.6.2). A pool value or total that is not an exact integer MUST be an error (9.4). A canonical form MUST re-parse to the same roll (11.5).
- **0.9.0 rev. 6** (2026-11-20): audit of the text, grammar, vectors and reference implementation. Stated for the first time: the order of authority among prose, grammar, vectors and reference implementation (1.3); pool order after Drop and Keep, the tie rule and die-by-die rolling (6.5.1); the Reroll limit (6.5.2); Unique's order (6.5.3); Keep highest with Keep lowest is an error (6.9); the committed choice among `!` forms (8.3); whitespace (8.2); repeat products and exact operands (9.4). Corrected: repeated operators in a condition list (5.2), the Replace, Reroll and Reroll Once grammar (Appendix F), the Scale list for geometric dice (4.3), Section 11.4. Vectors 62 to 105; a vector answers several pools as one pool in notation order (11.3). The runner fails an error that arrives with a result, an empty error message, and a total on string faces.
- **0.9.0 rev. 5** (2026-11-01): a geometric die takes only Scale modifiers, and any other modifier MUST be rejected (4.3); error vectors 60 and 61. Custom Faces dice MAY take a quantity (4.6 now agrees with 4.2 and vector 31).
- **0.9.0 rev. 4** (2026-10-31): the specification is published at https://notation.randsum.dev/; badge URLs, the vectors' location and `$id`, and the schema move with it. No normative change.
- **0.9.0 rev. 3** (2026-10-31): the specification, vectors and a conformance runner move to their own repository and package, under CC BY 4.0 (text) and MIT (vectors and runner). Vectors 31, 33 and 51 gain an `unseeded` field; the vectors file gains a JSON Schema; the runner and its adapter protocol are described in Section 11.3.1. No vector changes its expected result.
- **0.9.0 rev. 2** (2026-10-31): audit against the reference implementation; conformance badges; vectors 56 to 59.
- **0.9.0** (2026-03-21): initial public draft.
