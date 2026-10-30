# RANDSUM Claude Code Plugin

The `randsum` plugin, published through this repo's marketplace (`.claude-plugin/marketplace.json` at the repo root). It ships four [skills](https://code.claude.com/docs/en/skills), a `/roll` command, and connects one MCP server, the hosted [`@randsum/mcp`](../../packages/mcp) at `https://api.randsum.dev/mcp`, so the skills can roll with the real engine without installing anything. Where no MCP server is connected, the `dice-rolling` skill calls the [HTTP API](https://randsum.dev/api/introduction/) at `https://api.randsum.dev/v1` instead.

| Skill | Description |
|---|---|
| [`dice-rolling`](./skills/dice-rolling/SKILL.md) | Turn a natural-language roll request into an MCP or HTTP API call and explain the result; never invent a number |
| [`randsum-library`](./skills/randsum-library/SKILL.md) | Write code with `@randsum/roller` and `@randsum/games`, or call the REST API from other languages |
| [`dice-probability`](./skills/dice-probability/SKILL.md) | Analyze probability distributions, expected values, and outcome comparisons for dice notation and game systems |
| [`game-spec-creator`](./skills/game-spec-creator/SKILL.md) | Create `.randsum.json` specs for custom TTRPG dice mechanics, translate game rules into declarative specs |

## Installation

```
/plugin marketplace add RANDSUM/randsum
/plugin install randsum@randsum
```

On Claude Code 2.1.275 or later, `/plugin install randsum --marketplace RANDSUM/randsum` does both in one step.

The plugin has no `version`, so installs track this repo's commits. Users pick up changes with `/plugin marketplace update randsum`, or by turning on auto-update for the `randsum` marketplace in `/plugin`.

To offer it to everyone on a project, run `claude plugin marketplace add RANDSUM/randsum --scope project` and `claude plugin install randsum@randsum --scope project` there and commit the `.claude/settings.json` they write.

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

## The `/roll` mod

[`hooks/`](./hooks) is a Claude Code mod: `hooks.json` names one hooks module, [`register.ts`](./hooks/register.ts), which registers `/roll <notation>`. It rolls in Claude Code's hooks sandbox with no model turn, prints the result, pins it as the plugin's status line, and hands Claude a hidden note saying the user rolled it. Game interpretation stays with the skills and MCP.

- The sandbox imports only files inside the plugin, so [`roller.generated.js`](./hooks/roller.generated.js) is `roll()` from `@randsum/roller`, bundled by `bun run plugin:roller`. `bun run check:plugin-roller` (in `bun run check` and CI) fails when it is stale; re-run the bundle after any roller change. [`roller.generated.d.ts`](./hooks/roller.generated.d.ts) is hand-written.
- `hooks.json` keeps an empty `hooks` object beside `modules` so Claude Code builds from before mods still read the file as valid.
- Hooks modules are early access and the API may change between releases. `claude plugin validate plugins/randsum` reports what the module hooks and calls; `claude plugin test plugins/randsum` runs [`roll.test.ts`](./hooks/roll.test.ts) (set `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` on builds where modules are off by default).

## Discovery

The marketplace entry carries a `relevance` block, so Claude Code can suggest the plugin when a session reads a `*.randsum.json` spec or a `package.json` that depends on `@randsum/roller`, `@randsum/games` or `@randsum/mcp`. Suggestions show only where an admin lists the `randsum` marketplace in `pluginSuggestionMarketplaces`. [`icon.png`](.claude-plugin/icon.png) is the plugin's die in its product colour, from the site's design system.

The site lists every agent channel on [randsum.dev/tools/agents](https://randsum.dev/tools/agents/), from [`agents.ts`](../../apps/site/src/utils/agents.ts). A new channel is one entry there plus its own doc page.

## Adding a New Skill

1. Create a directory under `plugins/randsum/skills/<skill-name>/`
2. Add a `SKILL.md` with YAML frontmatter (`name`, `description`) and instructions
3. Optionally add `references/` for large reference files Claude loads on demand

See the [Claude Code skills documentation](https://code.claude.com/docs/en/skills) for guidance on writing effective skills.
