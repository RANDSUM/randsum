#!/usr/bin/env bun

/**
 * Publish-client guard — enforce "always publish through bun so workspace: resolves".
 *
 * The bun/pnpm `workspace:` protocol is a dev-time reference that must be resolved
 * to a real semver range at pack time. `bun` (via `bun pm pack` / `bun publish`)
 * does this; a raw `npm publish` does NOT — it ships the literal `workspace:~`,
 * producing a package that is completely uninstallable:
 *
 *     npm error code EUNSUPPORTEDPROTOCOL
 *     npm error Unsupported URL Type "workspace:": workspace:~
 *
 * That is exactly how the legacy standalone game packages (@randsum/salvageunion,
 * daggerheart, blades, fifth, root-rpg, pbta) were broken. This runs as each
 * publishable package's `prepublishOnly` hook.
 *
 * npm runs `prepublishOnly` on `npm publish <dir>` but NOT on `npm publish <tarball>`,
 * and the sanctioned path (scripts/publish.ts) publishes an already-resolved tarball —
 * so this guard never trips the sanctioned path, only a direct `npm publish` footgun.
 * Publishing via `bun run publish` or a direct `bun publish` passes.
 */

const userAgent = process.env['npm_config_user_agent'] ?? ''

if (!userAgent.startsWith('bun')) {
  console.error(
    `Refusing to publish via ${userAgent.split('/')[0] || 'a non-bun client'}: it does not ` +
      'resolve the `workspace:` protocol, so the published package would be uninstallable ' +
      '(npm EUNSUPPORTEDPROTOCOL).\n' +
      'Publish with `bun run publish` (from the repo root) or a direct `bun publish`.'
  )
  process.exit(1)
}
