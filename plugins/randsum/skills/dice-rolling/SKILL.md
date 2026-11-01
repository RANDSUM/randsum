---
name: dice-rolling
description: Rolls tabletop RPG dice for the user with the real RANDSUM engine (its MCP tools or the api.randsum.dev HTTP API) and explains the result. Use whenever the user asks to roll dice or wants a random game result, even casually ("roll for initiative", "give me a strength score", "do I hit?"), writes dice notation such as 4d6L or 2d20+5, or asks for a roll in D&D 5e, Blades in the Dark, Daggerheart, Fate, PbtA, Root RPG or Salvage Union. For writing code that rolls dice use randsum-library; for odds and expected values use dice-probability.
license: MIT
metadata:
  author: RANDSUM
  repository: https://github.com/RANDSUM/randsum
---

# Dice Rolling

Turn what the user asked for into a RANDSUM roll, get the result from the real engine, and report it. **Never invent a dice result.** Language models are not random; a made-up roll is a wrong answer even when it looks plausible.

## 1. Pick the tool

Use the first one available:

1. **RANDSUM MCP tools.** This plugin connects them (claude.ai users add `https://api.randsum.dev/mcp` as a connector). In Claude Code they are listed as `mcp__plugin_randsum_randsum__roll` and so on.
   - `roll_game` when the user names a supported game. It returns the game's outcome, not just a number.
   - `roll` for plain notation.
   - `validate` to check or explain notation, or to repair notation `roll` rejected.
2. **The HTTP API** at `https://api.randsum.dev/v1`, if you can make a web request (`curl` in a shell, or a fetch tool). Public, keyless, JSON:
   - `GET /v1/roll?notation=4d6L` (URL-encode: `+` is `%2B`, `{` is `%7B`, `}` is `%7D`)
   - `GET /v1/games/<game>/roll?<inputs>`, e.g. `/v1/games/blades/roll?rating=3`
   - `GET /v1/validate?notation=...`, `GET /v1/random?min=1&max=100&count=5`, `GET /v1/games`
   - `POST` with a JSON body works for `roll`, `validate` and game rolls too, and avoids URL encoding.
3. **Local code**, if you have a shell but no network: `node -e "console.log(require('crypto').randomInt(1, 21))"` for a d20, and do the dice arithmetic yourself. Say the roll came from a local RNG.
4. **Nothing available:** tell the user you cannot roll real dice here and give the notation they can roll themselves. Only simulate if they ask you to, and label it simulated.

## 2. Translate the request

| The user says | Call |
|---|---|
| "Roll a d20" / "roll 2d6+3" | `roll` with `1d20` / `2d6+3` |
| "Attack with advantage, +5" (D&D) | `roll_game` `fifth` `{ "modifier": 5, "rollingWith": "Advantage", "crit": true }` |
| "Roll stats" / "ability scores" | `roll` with `4d6Lx6` |
| "Roll 3 dice for Blades" / "action rating 2 plus a push" | `roll_game` `blades` `{ "rating": 3 }` |
| "Duality roll, +2, with advantage" (Daggerheart) | `roll_game` `daggerheart` `{ "modifier": 2, "rollingWith": "Advantage" }` |
| "Fate roll, Good skill" | `roll_game` `fate` `{ "modifier": 3 }` |
| "Roll +Hard" with Hard 2 (PbtA) | `roll_game` `pbta` `{ "stat": 2 }` |
| "Roll on the Morale table" (Salvage Union) | `roll_game` `salvageunion` `{ "tableName": "Morale" }` |
| "Fireball damage" | `roll` with `8d6` |
| "Crit with my longsword, +3" | `roll` with `2d8+3` (double the dice, not the modifier) |
| "Five d10s, count 8 or higher" | `roll` with `5d10S{8}` |
| "Roll percentile" | `roll` with `d%` |

Rules of thumb:

- **Ask only when a required number is missing** and you cannot reasonably assume it (a PbtA `stat`, a Salvage Union table). Otherwise assume the common default and say so ("assuming no modifier").
- **One call per independent roll.** Attack and damage are two calls, because damage only happens on a hit. Use `xN` (`4d6Lx6`) for N identical rolls.
- **Pass a `seed` only when the user asks** for a reproducible or shareable roll.
- **On an error,** read the message and the `suggestion`, fix the notation once (or call `validate`), and retry. Do not loop.
- **Unsupported games** roll as plain notation; interpret by the game's rules yourself.

Each game's inputs, ranges and outcomes: [references/GAME_SYSTEMS.md](references/GAME_SYSTEMS.md).

## 3. Report the result

Show, in one compact block:

1. **What was rolled**: the notation or game roll, and what it is for
2. **The dice**: values from the tool, marking dropped or rerolled dice when it tells you
3. **The total**
4. **What it means** in the game: hit or miss, success tier, Hope or Fear, ladder rung, table entry

```
Strength (4d6L): rolled [5, 3, 4, 2], dropped the 2 → 12 (modifier +1)
```

```
Blades, 3 dice: [2, 5, 4] → highest 5: partial success.
You do it, but there's a consequence: harm, a complication, or reduced effect.
```

Report the numbers exactly as returned. Add at most one sentence of flavour for game rolls. Don't explain notation unless asked.

## Notation quick reference

Case-insensitive. `NdS` rolls N dice with S sides; `d20` means `1d20`.

| Notation | Meaning |
|---|---|
| `1d20+5` | Add 5 (`-` subtracts) |
| `4d6L` | Drop the lowest (`L2` drops two) |
| `2d20H` | Drop the highest |
| `4d6K3` | Keep the highest 3 |
| `4d6kl2` | Keep the lowest 2 |
| `4d6R{1}` | Reroll 1s |
| `4d20R{<5}` | Reroll under 5 |
| `3d6!` | Explode: roll again on a max |
| `3d6!!` | Compound: add the extra roll to the same die |
| `3d6!p` | Penetrate: explode, minus 1 each time |
| `4d20C{>18}` | Cap results over 18 at 18 |
| `4d20V{1=20}` | Replace 1s with 20s |
| `4d20U` | Every die unique |
| `5d10S{7}` | Count dice at 7 or over as successes |
| `5d10S{7,1}` | Successes at 7+, minus botches at 1 |
| `5d10F{3}` | Count dice at 3 or under as failures |
| `5d6W` | D6 System wild die |
| `2d6*2` | Multiply the dice sum, before `+`/`-` |
| `2d6+3**2` | Multiply the final total |
| `4d6//2` | Integer-divide the total |
| `4d6%3` | Total modulo 3 |
| `4dF` | Fate dice |
| `d%` | Percentile, 1d100 |
| `g6` | Geometric die: roll a d6 again on each 6, sum every roll |
| `3DD6` | Draw 3 from a d6 without replacement |
| `4d6Lx6` | Repeat 6 times |
| `2d6+3[fire]` | Label a group |
| `1d20+2d6+5` | Several groups, one total |

Conditions: `>N`, `<N`, `>=N`, `<=N`, `=N` or a bare `N` (exact). Modifiers run in a fixed order whatever order they are written in; [references/NOTATION.md](references/NOTATION.md) has the order and every modifier in full, and https://notation.randsum.dev/ is the specification.
