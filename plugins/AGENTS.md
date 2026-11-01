# plugins/

Claude Code plugins published by this repo. The root `.claude-plugin/marketplace.json` lists them; today that is one plugin, [`randsum/`](./randsum).

`randsum/README.md` is user-facing: Anthropic's plugin directory shows it as the listing description, and the directory's security scan reads it as the plugin's disclosure of what it runs and connects to. Keep it to what a user gets, how to install it, what leaves their machine, privacy and support. Maintainer notes live here, outside the plugin folder, because people who install the plugin get only `randsum/`, and `claude plugin validate` warns on a `CLAUDE.md` inside it.

## The randsum plugin

- Four skills in `randsum/skills/`, each `<name>/SKILL.md` with YAML front matter (`name`, `description`) plus optional `references/` that Claude loads on demand.
- `randsum/.mcp.json` connects only the hosted MCP server at `https://api.randsum.dev/mcp` (`apps/api`). The root `.mcp.json` holds the maintainers' ops servers and never ships.
- `randsum/.claude-plugin/plugin.json` sets `version`, and Claude Code keeps installed users on it until it changes, so every change under `randsum/` bumps it (patch for fixes and wording, minor for new skills or commands). `bun run check:plugin-version` fails a PR that changes the plugin without a bump. It carries no directory listing fields (`icon`, `documentationUrl`, `supportUrl`, `privacyPolicyUrl`): the directory's scan warns on each one, and Jrvs chose a warning-free scan over the listing icon and links. The privacy policy is `apps/site/src/content/docs/privacy.mdx`; when the plugin starts sending anything new, update both it and the README's disclosure.
- The marketplace entry carries a `relevance` block, so Claude Code can suggest the plugin when a session reads a `*.randsum.json` spec or a `package.json` that depends on `@randsum/roller`, `@randsum/games` or `@randsum/mcp`.
- The site lists every agent channel on randsum.dev/tools/agents, from `apps/site/src/utils/agents.ts`. A new channel is one entry there plus its own doc page.

## The `/roll` mod

`randsum/hooks/` is a Claude Code mod: `hooks.json` names one hooks module, `register.ts`, which registers `/roll <notation>`. It rolls in Claude Code's hooks sandbox with no model turn, prints the result, pins it as the plugin's status line, and hands Claude a hidden note saying the user rolled it.

- The sandbox imports only files inside the plugin, so `roller.generated.js` is `roll()` from `@randsum/roller`, bundled unminified by `bun run plugin:roller` so the directory's scan can read it. `bun run check:plugin-roller` (in `bun run check` and CI) fails when it is stale; re-run the bundle after any roller change. `roller.generated.d.ts` is hand-written.
- `hooks.json` keeps an empty `hooks` object beside `modules` so Claude Code builds from before mods still read the file as valid.
- Hooks modules are early access. `claude plugin validate plugins/randsum` reports what the module hooks and calls; `claude plugin test plugins/randsum` runs `roll.test.ts` (set `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` on builds where modules are off by default).

## Local work

Skills do not load just because you are working inside this repo. Load the working tree with `claude --plugin-dir plugins/randsum`.

## Anthropic's directory

The plugin and the hosted MCP server are submitted separately at claude.ai/directory/manage: the plugin as a **Plugin bundle** with plugin path `plugins/randsum`, the server as an **MCP connector**. After the first listing, merges to `main` reach the directory automatically through its tracked-branch scan. Every file in `randsum/` must stay under 256 KiB and be readable text or a PNG/JPEG/GIF/WebP image, or the version is held for a reviewer. CI keeps the directory's warnings out: `claude plugin validate --strict` on the plugin and marketplace, and `bun run check:plugin-scan` (also in `bun run check`), which fails on oversized or binary files, download-and-run shell or `node -e`, code that reads `crypto`, env vars or keychains, and getters, Proxies, `then` methods or `Object.defineProperty` in the mod's code. Roll with roller's default RNG, and keep skills to the MCP tools and the HTTP API.
