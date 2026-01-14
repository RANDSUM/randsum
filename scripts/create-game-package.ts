#!/usr/bin/env bun

/**
 * Game Package Generator
 *
 * Usage: bun scripts/create-game-package.ts <game-name>
 *
 * Creates a new game package with the standard RANDSUM structure.
 */

import { $ } from 'bun'
import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync } from 'fs'

const gameName = process.argv[2]

if (!gameName) {
  console.error('Error: Game name required')
  console.error('Usage: bun scripts/create-game-package.ts <game-name>')
  process.exit(1)
}

const packageName = gameName.toLowerCase().replace(/\s+/g, '-')
const packageDir = join(process.cwd(), 'packages', packageName)
const pascalName = gameName
  .split(/[-_\s]/)
  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  .join('')

if (existsSync(packageDir)) {
  console.error(`Error: Package directory already exists: ${packageDir}`)
  process.exit(1)
}

console.log(`Creating game package: ${packageName}`)

// Create directory structure
mkdirSync(packageDir, { recursive: true })
mkdirSync(join(packageDir, 'src'), { recursive: true })
mkdirSync(join(packageDir, 'src', `roll${pascalName}`), { recursive: true })
mkdirSync(join(packageDir, '__tests__'), { recursive: true })

// package.json
const packageJson = {
  name: `@randsum/${packageName}`,
  version: '0.1.0',
  description: `${pascalName} compatible dice rolling implementation`,
  private: false,
  author: {
    name: 'Alex Jarvis',
    url: 'https://github.com/alxjrvs'
  },
  license: 'MIT',
  homepage: 'https://github.com/RANDSUM/randsum',
  repository: {
    type: 'git',
    url: 'git+https://github.com/RANDSUM/randsum.git',
    directory: `packages/${packageName}`
  },
  sideEffects: false,
  type: 'module',
  main: './dist/index.cjs',
  module: './dist/index.js',
  types: './dist/index.d.ts',
  source: './src/index.ts',
  'react-native': './src/index.ts',
  files: ['dist', 'src', 'LICENSE', 'README.md'],
  dependencies: {
    '@randsum/roller': 'workspace:~'
  },
  exports: {
    '.': {
      import: {
        types: './dist/index.d.ts',
        default: './dist/index.js'
      },
      require: {
        types: './dist/index.d.cts',
        default: './dist/index.cjs'
      }
    },
    './package.json': './package.json'
  },
  engines: {
    bun: '>=1.0.0'
  },
  keywords: ['dice', 'roller', 'rpg', 'random', 'typescript', 'tabletop', packageName],
  scripts: {
    build:
      'bunup --entry src/index.ts --format esm,cjs --dts --minify --sourcemap external --target node --clean',
    test: 'bun test',
    lint: 'eslint . -c ../../eslint.config.js',
    format: 'prettier --write . --ignore-path ../../.prettierignore --config ../../.prettierrc',
    'format:check':
      'prettier --check . --ignore-path ../../.prettierignore --config ../../.prettierrc',
    typecheck: 'tsc --noEmit'
  }
}

writeFileSync(join(packageDir, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n')

// tsconfig.json
const tsconfig = {
  extends: '../../tsconfig.packages.json',
  compilerOptions: {
    outDir: 'dist'
  },
  include: ['src/**/*'],
  exclude: ['node_modules', 'dist', '**/*.test.ts', '**/*.spec.ts']
}

writeFileSync(join(packageDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2) + '\n')

// src/index.ts
const indexTs = `export { roll${pascalName} } from './roll${pascalName}'
export type { ${pascalName}RollArgument, ${pascalName}RollResult } from './types'
`

writeFileSync(join(packageDir, 'src', 'index.ts'), indexTs)

// src/types.ts
const typesTs = `export interface ${pascalName}RollArgument {
  // Add your game-specific roll arguments here
}

export interface ${pascalName}RollResult {
  // Add your game-specific result type here
}
`

writeFileSync(join(packageDir, 'src', 'types.ts'), typesTs)

// src/roll${pascalName}/index.ts
const rollIndexTs = `import type { RollRecord, GameRollResult } from '@randsum/roller'
import { roll } from '@randsum/roller'
import type { ${pascalName}RollArgument, ${pascalName}RollResult } from '../types'

export function roll${pascalName}(
  arg: ${pascalName}RollArgument
): GameRollResult<${pascalName}RollResult, undefined, RollRecord> {
  // Implement your game-specific roll logic here
  const rollResult = roll({
    sides: 20,
    quantity: 1
  })

  return {
    rolls: rollResult.rolls,
    total: rollResult.total,
    result: {} as ${pascalName}RollResult
  }
}
`

writeFileSync(join(packageDir, 'src', `roll${pascalName}`, 'index.ts'), rollIndexTs)

// __tests__/${packageName}.test.ts
const testTs = `import { describe, expect, test } from 'bun:test'
import { roll${pascalName} } from '../src'

describe('roll${pascalName}', () => {
  test('basic functionality', () => {
    const result = roll${pascalName}({})
    expect(result.total).toBeGreaterThanOrEqual(1)
  })
})
`

writeFileSync(join(packageDir, '__tests__', `${packageName}.test.ts`), testTs)

// README.md
const readme = `# @randsum/${packageName}

${pascalName} compatible dice rolling implementation.

## Installation

\`\`\`bash
bun add @randsum/${packageName}
\`\`\`

## Usage

\`\`\`typescript
import { roll${pascalName} } from '@randsum/${packageName}'

const result = roll${pascalName}({})
\`\`\`
`

writeFileSync(join(packageDir, 'README.md'), readme)

// LICENSE (copy from another package)
const license = `MIT License

Copyright (c) 2022 alxjrvs@gmail.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`

writeFileSync(join(packageDir, 'LICENSE'), license)

// AGENTS.md
const agentsMd = `# @randsum/${packageName}

${pascalName} dice rolling package for RANDSUM.
`

writeFileSync(join(packageDir, 'AGENTS.md'), agentsMd)

console.log(`✓ Created game package: ${packageName}`)
console.log(`  Location: ${packageDir}`)
console.log(`  Next steps:`)
console.log(`  1. Update src/types.ts with your game-specific types`)
console.log(`  2. Implement roll${pascalName} in src/roll${pascalName}/index.ts`)
console.log(`  3. Add tests in __tests__/${packageName}.test.ts`)
console.log(`  4. Run 'bun install' to install dependencies`)
