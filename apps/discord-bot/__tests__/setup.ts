/**
 * Test preload: resolve discord.js CJS→ESM interop issue.
 *
 * discord.js v14's entry point is CJS with __exportStar re-exports.
 * Bun on Linux can't statically analyze __exportStar for ESM named
 * exports. This preload loads discord.js via require() (which executes
 * the CJS and gets ALL exports) and re-exposes them through mock.module
 * as a proper ESM module that Bun can link against.
 *
 * Individual test files then call mock.module('discord.js', ...) again
 * with their own mock factories — this overrides the preload for
 * assertion purposes while the ESM module graph is already resolved.
 */
import { mock } from 'bun:test'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const discord = require('discord.js')

// Re-expose ALL discord.js exports as a proper ESM module
void mock.module('discord.js', () => discord)
