#!/usr/bin/env bun

/**
 * Development Help Script
 *
 * Usage: bun run help
 *
 * Displays available development commands organized by category.
 */

const categories: Record<string, Record<string, string>> = {
  'Daily Development': {
    test: 'Run all tests recursively',
    build: 'Build all packages (ESM + types, no CJS)',
    'fix:all': 'Auto-fix lint issues and format code',
    check: 'Run the full per-package check chain locally'
  },
  'Code Quality': {
    lint: 'Run ESLint across all packages',
    format: 'Format code with Biome',
    'format:check': 'Check if code is formatted',
    typecheck: 'Run TypeScript type checking',
    knip: 'Find unused files, deps, and exports'
  },
  'Testing & Analysis': {
    'test:coverage': 'Run tests with coverage report',
    bench: 'Run performance benchmarks',
    profile: 'CPU profile benchmarks (Chrome DevTools)',
    'profile:md': 'CPU profile benchmarks (Markdown)'
  },
  'Site Development': {
    'site:dev': 'Start Astro dev server (localhost:4321)',
    'site:build': 'Build documentation site'
  },
  Release: {
    changeset: 'Create a new changeset',
    'version-packages': 'Version packages from changesets',
    publish: 'Build, check, and publish packages to NPM'
  }
}

console.log('\n🎲 RANDSUM Development Scripts\n')
console.log('='.repeat(55))

for (const [category, scripts] of Object.entries(categories)) {
  console.log(`\n${category}:`)
  for (const [name, desc] of Object.entries(scripts)) {
    console.log(`  bun run ${name.padEnd(20)} ${desc}`)
  }
}

console.log('\n' + '='.repeat(55))
console.log('\nPackage-specific commands:')
console.log('  bun run --filter @randsum/<pkg> <script>')
console.log(
  '\nAdd a new game: add <shortcode>.randsum.json to packages/games/, run bun run --filter @randsum/games gen'
)
console.log('\nMore info: CLAUDE/scripts.md or CONTRIBUTING.md\n')
