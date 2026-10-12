# RANDSUM Claude Code Plugin

The `randsum` plugin, published through this repo's marketplace (`.claude-plugin/marketplace.json` at the repo root). It ships three [skills](https://code.claude.com/docs/en/skills) and one MCP server, [`@randsum/mcp`](../../packages/mcp), so the skills can roll with the real engine.

| Skill | Description |
|---|---|
| [`dice-rolling`](./skills/dice-rolling/SKILL.md) | Roll dice, interpret results, and answer questions about RANDSUM notation and supported game systems |
| [`dice-probability`](./skills/dice-probability/SKILL.md) | Analyze probability distributions, expected values, and outcome comparisons for dice notation and game systems |
| [`game-spec-creator`](./skills/game-spec-creator/SKILL.md) | Create `.randsum.json` specs for custom TTRPG dice mechanics, translate game rules into declarative specs |

## Installation

```
/plugin marketplace add RANDSUM/randsum
/plugin install randsum@randsum
```

The skills do not load just because you are working inside this repo. Install the plugin, or load the working tree directly while editing it:

```bash
claude --plugin-dir plugins/randsum
```

## Using a Skill

Claude Code picks up skills from context, so you can just ask:

```
Roll 4d6L for my strength score
What's the Blades in the Dark result for a pool of 3?
Roll with advantage and a +5 modifier
```

Plugin skills are namespaced, so the explicit form is `/randsum:dice-rolling`.

## Adding a New Skill

1. Create a directory under `plugins/randsum/skills/<skill-name>/`
2. Add a `SKILL.md` with YAML frontmatter (`name`, `description`) and instructions
3. Optionally add `references/` for large reference files Claude loads on demand

See the [Claude Code skills documentation](https://code.claude.com/docs/en/skills) for guidance on writing effective skills.
