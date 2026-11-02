@AGENTS.md

## Claude Code

- Review changes with the built-in `/code-review`.
- Subagents in `.claude/agents/`: `senior-dev` (implementation in an isolated worktree cut from `main`), `ttrpg-enthusiast` (read-only game-mechanics review), `json-schema-expert` (`.randsum.json` specs and the meta-schema).
- Project skills in `.claude/skills/`: `add-modifier` (invoke as `/add-modifier`), and the vendored Cloudflare skills below.
- The `randsum` plugin's skills do not load in this repo's sessions. Load the working tree with `claude --plugin-dir plugins/randsum`.

### Cloudflare Skills

`.claude/skills/` vendors two of Cloudflare's published agent skills, `workers-best-practices` and `wrangler`. `scripts/sync-cloudflare-skills.ts` records why each is kept and why the others are not.

```bash
bun run skills:sync   # re-vendor at the pinned COMMIT; bump it to refresh
```

Read the diff when you do: it is third-party prose that steers an agent.

### MCP Servers

`.mcp.json` declares these. Run `/mcp` to authorize or check them.

| Server                     | Backs                             | Auth                                       |
| -------------------------- | --------------------------------- | ------------------------------------------ |
| `cloudflare-observability` | Workers logs and analytics        | OAuth                                      |
| `github`                   | repo host (issues, PRs, releases) | PAT via `scripts/mcp-1password-headers.sh` |

The `github` helper takes `GITHUB_PAT` if exported, otherwise reads the `claude-git-pat` item's `credential` with a service-account token: `OP_SERVICE_ACCOUNT_TOKEN` if exported (cloud sessions, scoped to the `Randsum` vault), else the macOS keychain item `op-claude-agent` (scoped to the `claude-agent` vault). It tries `op://Randsum/…` then `op://claude-agent/…`. With neither it exits 1, and `/mcp` shows `github` as failed rather than connected with an empty token.
