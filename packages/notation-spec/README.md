# RANDSUM Dice Notation

The specification of the RANDSUM Dice Notation (RDN), a format for dice rolls in tabletop games (`4d6L`, `1d20+5`, `3d6!{>5}`), with its conformance test vectors and a runner that proves which conformance level an implementation reaches.

- **Read it:** https://randsum.dev/spec/
- **Version:** 0.9.0, revision 3 (draft community specification)
- **Vectors:** [`vectors/v0.9.0.json`](vectors/v0.9.0.json), described by [`schema/conformance.schema.json`](schema/conformance.schema.json)
- **Badges:** https://randsum.dev/spec/conformance/

| Path | What it is | Licence |
| --- | --- | --- |
| `spec/` | The specification, one Markdown file per version | [CC BY 4.0](spec/LICENSE.md) |
| `vectors/` | Conformance test vectors, one JSON file per version | [MIT](LICENSE) |
| `schema/` | JSON Schema for the vectors files | [MIT](LICENSE) |
| `src/`, `examples/` | The `rdn-conformance` runner and example adapters | [MIT](LICENSE) |

## Prove your roller conforms

Conformance comes in four levels, each a superset of the one before (spec Section 10): **1 Core**, **2 VTT Baseline**, **3 Extended** and **4 Full**. A level is reached when every vector it requires passes, together with every error vector.

1. Write an adapter: a small program, in your roller's language, that answers the runner over stdin and stdout ([protocol below](#adapter-protocol)). Start from [`examples/skeleton/adapter.py`](examples/skeleton/adapter.py), or read the reference adapter for `@randsum/roller` in [`examples/randsum-roller/`](examples/randsum-roller/).
2. Run the vectors against it (Node.js 18 or later):

   ```sh
   npx @randsum/notation-spec --level 2 -- python3 adapter.py
   ```

3. The runner prints each level's result, the failing vectors and why, and the badge for the highest level reached:

   ```
   RDN 0.9.0 conformance: 59/59 vectors pass

     Level 1 (Core)           pass   21 vectors
     Level 2 (VTT Baseline)   pass   32 vectors
     Level 3 (Extended)       pass   52 vectors
     Level 4 (Full)           pass   59 vectors

   RDN 0.9.0 Level 4 (Full) conformant.

   Badge:
     [![RDN 0.9.0 Level 4: Full](https://randsum.dev/spec/badges/v0.9.0/level-4.svg)](https://randsum.dev/spec/#10-conformance-levels)
   ```

   It exits 0 when the `--level` you asked for (default 1) is reached, so it can gate CI.

| Option | Meaning |
| --- | --- |
| `--level <1-4>` | Exit non-zero unless this level is reached (default 1) |
| `--vectors <file>` | A vectors file other than the bundled latest |
| `--json` | Print the full report as JSON |
| `--timeout <ms>` | How long to wait for each answer (default 5000) |

You don't have to use the runner: the vectors file stands alone, and spec Section 11.3 says how to use it with your own test framework.

## Adapter protocol

The runner starts the adapter command once and talks to it in [JSON Lines](https://jsonlines.org/): one request per line on the adapter's stdin, one response per line on its stdout, in order. Anything the adapter writes to stderr is shown, not parsed.

**Request:** the vector's `id` and `notation`, and the die values to replay in place of the random number generator. They are consumed in this order: `seedRolls` (the initial pool), then `rerollRolls`, `explodeRolls`, `compoundRolls`, `penetrateRolls`, and last `sequenceRolls`, each of which is the value on its own explode-sequence die. Only the fields a vector uses are present. A value is the face as shown on the die: `-1` for a Fate minus, `0` on a zero-bias die.

```json
{"id":56,"notation":"3d6!","seedRolls":[6,2,6],"explodeRolls":[6,2,3]}
```

**Response:** one of

```json
{"id":56,"pool":[6,6,2,2,6,3],"total":25}
{"id":28,"error":"Invalid notation: 4d"}
{"id":33,"pool":[2,5,3],"total":10,"seeded":false}
```

- `pool` is the final dice pool after every modifier, in the order the spec defines; `total` is the final result, or `null` when there is none (custom string faces).
- `error` (any string) means the implementation rejected the notation. It passes an error vector and fails every other.
- `seeded: false` says the result was rolled without replaying the request's rolls. Custom faces and draw dice depend on how an implementation maps random numbers to faces and shuffles, so for vectors 31, 33 and 51 such a result is checked against the vector's `unseeded` field instead: the right number of dice, every value one of its faces, distinct where it says so, and a numeric total that is the pool's sum. On any other vector `seeded: false` relaxes nothing.
- `id` is optional; when present it must match the request.

The runner also has a library API for implementations in JavaScript, which skips the process:

```ts
import { formatReport, runConformance } from '@randsum/notation-spec'
import vectors from '@randsum/notation-spec/vectors/v0.9.0.json' with { type: 'json' }

const report = await runConformance(vectors, request => myAdapter(request))
console.log(formatReport(report))
```

## Claiming a level

Once a level passes, say so in the form "RDN 0.9.0 Level N (Name) conformant" and show that level's badge, linked to the spec. Every badge, with Markdown and HTML to paste, is at https://randsum.dev/spec/conformance/.

## Versions and changes

The specification follows semantic versioning. While it is a draft, a revision corrects a version in place; a conformance claim names the version, not the revision. Each revision is tagged here as `v<version>-rev.<n>` (for example `v0.9.0-rev.3`) and listed in the spec's Section 1.5 and in [`CHANGELOG.md`](CHANGELOG.md).

## Feedback and contributing

Open an issue or a discussion here for questions, proposals and reports from other implementations. The specification is developed in the [RANDSUM monorepo](https://github.com/RANDSUM/randsum/tree/main/packages/notation-spec) beside its reference implementation, `@randsum/roller`, and this repository is a mirror of that directory, updated on every change. Pull requests are welcome here and are carried over to the monorepo.

## Licence

The specification text in `spec/` is licensed under [CC BY 4.0](spec/LICENSE.md). The test vectors, schema, runner and examples are licensed under the [MIT licence](LICENSE).
