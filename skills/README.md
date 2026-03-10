# RANDSUM Claude Skills

This directory contains [Claude Code skills](https://docs.anthropic.com/en/docs/claude-code/skills) that enhance Claude's ability to work with RANDSUM dice rolling in tabletop RPG contexts.

## Available Skills

| Skill | Description |
|---|---|
| [`dice-rolling`](./dice-rolling/SKILL.md) | Roll dice, interpret results, and answer questions about RANDSUM notation and supported game systems |

## Installation

### Project-local (automatic)

Skills in this directory are automatically available to Claude Code when you're working inside this repository. No setup needed.

### Global install (use anywhere)

To make a skill available in all your projects, copy it to your global skills directory:

```bash
cp -r skills/dice-rolling ~/.claude/skills/dice-rolling
```

Or symlink it to keep it in sync with the repo:

```bash
ln -s "$(pwd)/skills/dice-rolling" ~/.claude/skills/dice-rolling
```

Then restart Claude Code (or start a new session) for the skill to appear.

## Using a Skill

Claude Code picks up skills automatically based on context — just ask naturally:

```
Roll 4d6L for my strength score
What's the Blades in the Dark result for a pool of 3?
Roll with advantage and a +5 modifier
```

You can also invoke a skill explicitly with `/dice-rolling`.

## Adding a New Skill

1. Create a directory under `skills/<skill-name>/`
2. Add a `SKILL.md` with YAML frontmatter (`name`, `description`) and instructions
3. Optionally add `references/` for large reference files Claude loads on demand

See the [skill-creator skill](https://github.com/RANDSUM/randsum/tree/main/.claude/skills/create-game) or the [Claude Code skills documentation](https://docs.anthropic.com/en/docs/claude-code/skills) for guidance on writing effective skills.
