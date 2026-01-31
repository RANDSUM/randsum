import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Reads a file from the roller package.
 */
function readRollerFile(relativePath: string): string {
  const monorepoRoot = join(__dirname, '..', '..', '..', '..')
  const filePath = join(monorepoRoot, 'packages', 'roller', relativePath)
  return readFileSync(filePath, 'utf8')
}

/**
 * Registers all MCP resources for documentation access.
 */
export function registerResources(server: McpServer): void {
  // Dice notation documentation
  server.resource(
    'dice-notation-docs',
    'dice://notation/full',
    {
      title: 'RANDSUM Dice Notation Reference',
      description: 'Complete reference for RANDSUM dice notation syntax and modifiers',
      mimeType: 'text/markdown'
    },
    () => {
      const content = readRollerFile('RANDSUM_DICE_NOTATION.md')
      return {
        contents: [
          {
            uri: 'dice://notation/full',
            mimeType: 'text/markdown',
            text: content
          }
        ]
      }
    }
  )

  // Error reference documentation
  server.resource(
    'error-reference',
    'dice://errors/reference',
    {
      title: 'RANDSUM Error Reference',
      description: 'Complete catalog of RANDSUM error types, causes, and recovery strategies',
      mimeType: 'text/markdown'
    },
    () => {
      const content = readRollerFile('ERROR_REFERENCE.md')
      return {
        contents: [
          {
            uri: 'dice://errors/reference',
            mimeType: 'text/markdown',
            text: content
          }
        ]
      }
    }
  )

  // Game systems summary
  server.resource(
    'game-systems',
    'dice://games/systems',
    {
      title: 'RANDSUM Game Systems',
      description: 'Summary of all supported game systems and their mechanics',
      mimeType: 'text/markdown'
    },
    () => {
      const content = `# RANDSUM Game Systems

## Supported Game Packages

### @randsum/blades - Blades in the Dark
- **Mechanics**: d6 dice pools, keep highest result
- **Outcomes**: 6 = success, 4-5 = partial, 1-3 = failure
- **Special**: Multiple 6s = critical success
- **Usage**: \`rollBlades(poolSize)\`

### @randsum/daggerheart - Daggerheart RPG
- **Mechanics**: Hope/Fear d12 system
- **Roll**: 2d12 (one Hope, one Fear)
- **Outcome**: Higher die determines narrative, sum determines mechanical success
- **Usage**: \`rollDaggerheart()\`

### @randsum/fifth - D&D 5th Edition
- **Mechanics**: d20 with advantage/disadvantage
- **Advantage**: Roll 2d20, keep highest (\`2d20L\`)
- **Disadvantage**: Roll 2d20, keep lowest (\`2d20H\`)
- **Ability Scores**: \`4d6L\` (roll 4d6, drop lowest)
- **Usage**: \`actionRoll(notation, { advantage: true })\`

### @randsum/root-rpg - Root RPG
- **Mechanics**: 2d6 + stat modifier
- **Outcomes**: 10+ = strong hit, 7-9 = weak hit, 6- = miss
- **Usage**: \`rollRootRpg(statValue)\`

### @randsum/pbta - Powered by the Apocalypse
- **Mechanics**: 2d6 + stat modifier (generic PbtA)
- **Outcomes**: 10+ = strong hit, 7-9 = weak hit, 6- = miss
- **Special**: Supports advantage/disadvantage (3d6, keep 2), forward/ongoing bonuses
- **Usage**: \`rollPbtA({ stat, forward?, ongoing?, advantage?, disadvantage? })\`
- **Games**: Works for Dungeon World, Monster of the Week, Apocalypse World, Masks, and more

### @randsum/salvageunion - Salvage Union
- **Mechanics**: d20 roll-under system
- **Outcome**: Lower is better, 1 = critical success, 20 = critical failure
- **Usage**: \`rollTable(tableName)\`

## Common Patterns

All game packages:
- Depend on \`@randsum/roller\` core package
- Return \`GameRollResult<TResult, TDetails, RollRecord>\` interface
- Export roll function and result types
- Include comprehensive tests in \`__tests__/\` directories
`
      return {
        contents: [
          {
            uri: 'dice://games/systems',
            mimeType: 'text/markdown',
            text: content
          }
        ]
      }
    }
  )
}
