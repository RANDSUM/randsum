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
    build: 'Build all packages (ESM + CJS + types)',
    'fix:all': 'Auto-fix lint issues and format code',
    'check:all': 'Run full CI pipeline locally'
  },
  'Code Quality': {
    lint: 'Run ESLint across all packages',
    format: 'Format code with Prettier',
    'format:check': 'Check if code is formatted',
    typecheck: 'Run TypeScript type checking',
    'check:exports': 'Find unused exports'
  },
  'Testing & Analysis': {
    'test:coverage': 'Run tests with coverage report',
    bench: 'Run performance benchmarks',
    profile: 'CPU profile benchmarks (Chrome DevTools)',
    'profile:md': 'CPU profile benchmarks (Markdown)',
    size: 'Check bundle sizes against limits'
  },
  'Site Development': {
    'site:dev': 'Start Astro dev server (localhost:4321)',
    'site:build': 'Build documentation site'
  },
  'MCP Server': {
    'mcp:compile': 'Build standalone MCP binary (current OS)',
    'mcp:compile:all': 'Build MCP binaries for all platforms'
  },
  Release: {
    changeset: 'Create a new changeset',
    'changeset:version': 'Version packages from changesets',
    'changeset:publish': 'Publish packages to NPM'
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
console.log('\nCreate new game package:')
console.log('  bun run create:game <game-name>')
console.log('\nMore info: AGENTS/scripts.md or CONTRIBUTING.md\n')
