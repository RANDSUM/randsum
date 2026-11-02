#!/usr/bin/env bun

/**
 * Publish guard — enforce "publish only through scripts/publish.ts".
 *
 * Runs as each publishable package's `prepublishOnly` hook, so it fires on any
 * publish straight from a package directory and refuses all of them:
 *
 * - A raw `npm publish` ships the literal `workspace:~` (npm does not resolve the
 *   bun/pnpm `workspace:` protocol), producing an uninstallable package:
 *
 *       npm error code EUNSUPPORTEDPROTOCOL
 *       npm error Unsupported URL Type "workspace:": workspace:~
 *
 * - A direct `bun publish` resolves `workspace:` but skips the pack-time
 *   `sideEffects: true` -> `false` flip that scripts/publish.ts applies to roller and
 *   games (ADR-018), so it would ship a manifest that defeats consumer tree-shaking.
 *
 * The sanctioned path never reaches this guard: scripts/publish.ts packs with
 * `bun pm pack` (which does not run `prepublishOnly`) and publishes the resulting
 * tarball with `npm publish <tarball>` (which does not run it either). It also sets
 * RANDSUM_PUBLISH_SCRIPT=1 so the guard passes should a lifecycle ever invoke it.
 */

if (process.env['RANDSUM_PUBLISH_SCRIPT'] !== '1') {
  const client = (process.env['npm_config_user_agent'] ?? '').split('/')[0] || 'this client'
  console.error(
    `Refusing to publish via ${client} from a package directory: only scripts/publish.ts ` +
      'resolves `workspace:` and applies the ADR-018 sideEffects flip.\n' +
      'Publish with `bun run publish` (from the repo root).'
  )
  process.exit(1)
}
