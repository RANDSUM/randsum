# RANDSUM

Real dice for Claude. The RANDSUM plugin teaches Claude tabletop RPG dice: it rolls any [RANDSUM dice notation](https://notation.randsum.dev/) with a real engine instead of making numbers up, interprets rolls for Blades in the Dark, D&D 5e, Daggerheart, Fate, Powered by the Apocalypse, Root and Salvage Union, works out the odds of a roll, and writes game specs for your own dice mechanics.

## What you get

| Skill | What it does |
|---|---|
| [`dice-rolling`](./skills/dice-rolling/SKILL.md) | Turns a roll request ("roll 4d6, drop the lowest", "Blades roll with 3 dice") into a real roll and explains the result. Never invents a number |
| [`dice-probability`](./skills/dice-probability/SKILL.md) | Probability distributions, expected values and comparisons, such as advantage against a flat +2 |
| [`game-spec-creator`](./skills/game-spec-creator/SKILL.md) | Turns a game's dice rules into a `.randsum.json` spec |
| [`randsum-library`](./skills/randsum-library/SKILL.md) | Helps you write code with `@randsum/roller` and `@randsum/games`, or call the RANDSUM HTTP API from any language |

It also connects the RANDSUM MCP server (`roll`, `validate` and `roll_game` tools), and in Claude Code adds a `/roll` command so you can roll your own dice, such as `/roll 4d6L` or `/roll 1d20+5`.

## Install

In Claude Code, from this repository's marketplace:

```
/plugin marketplace add RANDSUM/randsum
/plugin install randsum@randsum
```

Then ask Claude things like:

```
Roll 4d6L for my strength score
What's the Blades in the Dark result for a pool of 3?
Roll a d20 with advantage and a +5 modifier
What are the odds of rolling 15 or more on 3d6?
```

## What it runs and connects to

- **One MCP server**, the hosted RANDSUM server at `https://api.randsum.dev/mcp`, declared in [`.mcp.json`](./.mcp.json). It needs no account or key. Its tools are read-only: they compute a roll from the notation and parameters Claude sends and return it.
- **The HTTP API fallback.** If that server is not connected, the `dice-rolling` skill may call the same service's HTTP API at `https://api.randsum.dev/v1` with the same notation and parameters.
- **`/roll`** (Claude Code only) is a mod: [`hooks/hooks.json`](./hooks/hooks.json) names one hooks module, [`register.ts`](./hooks/register.ts), and it hooks exactly two events.
    - `session.start`: registers the `/roll` slash command (`$.command.register`). Nothing else runs at session start.
    - `command.run` for `/roll` only: rolls the notation you typed with [`roller.generated.js`](./hooks/roller.generated.js), the open-source `@randsum/roller` engine bundled into the plugin, using your machine's cryptographic random number generator. It prints the result, sets the plugin's status line to the last roll (`$.ui.status`), and adds one note to Claude's context saying you rolled it and what came up.

    The hook makes no network call, reads and writes no files, runs no shell commands, reads no credentials or environment variables, and touches no other tool calls.

The plugin sends nothing anywhere else, reads no files or credentials, and changes no settings.

## Privacy

The plugin collects no personal data. The only data that leaves your machine is the dice notation and game parameters sent to `api.randsum.dev`, which keeps nothing beyond short-lived operational request logs. The full policy is at [randsum.dev/privacy](https://randsum.dev/privacy/).

## Support

Documentation: [randsum.dev/tools/claude-code-plugin](https://randsum.dev/tools/claude-code-plugin/). Bugs and questions: [github.com/RANDSUM/randsum/issues](https://github.com/RANDSUM/randsum/issues).

## License

MIT
