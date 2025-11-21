export interface PackageInfo {
  id: string
  name: string
  displayName: string
  description: string
  npmPackage: string
  color?: string
  category: 'core' | 'game' | 'tool'
  examples: CodeExample[]
  features?: string[]
}

export interface CodeExample {
  title: string
  code: string
  language: 'typescript' | 'bash' | 'json'
  hasLiveExample?: boolean
  stackblitzId?: string
}

export const corePackages: PackageInfo[] = [
  {
    id: 'roller',
    name: 'roller',
    displayName: 'Roller',
    description:
      'Core dice rolling engine with advanced notation support. The foundation of the RANDSUM ecosystem.',
    npmPackage: '@randsum/roller',
    category: 'core',
    color: undefined,
    features: [
      'Advanced dice notation (4d6L, 2d20H, etc.)',
      'Reroll modifiers',
      'Exploding dice',
      'Drop/keep modifiers',
      'Full TypeScript support'
    ],
    examples: [
      {
        title: 'Basic Roll',
        code: `import { roll } from '@randsum/roller';

// Simple d20 roll
roll(20); // Returns 1-20
// or
roll('1d20'); // Returns 1-20`,
        language: 'typescript',
        hasLiveExample: true
      },
      {
        title: 'Character Stat Roll',
        code: `import { roll } from '@randsum/roller';

// Roll 4d6, drop lowest (D&D ability scores)
roll('4d6L');`,
        language: 'typescript',
        hasLiveExample: true
      },
      {
        title: 'Advantage and Disadvantage',
        code: `import { roll } from '@randsum/roller';

// Roll with advantage (2d20, keep highest)
roll('2d20H');

// Roll with disadvantage (2d20, keep lowest)
roll('2d20L');`,
        language: 'typescript',
        hasLiveExample: true
      },
      {
        title: 'Complex Notation',
        code: `import { roll } from '@randsum/roller';

// Roll 4d6, drop lowest, reroll below 3
roll('4d6L!R{<3}');`,
        language: 'typescript',
        hasLiveExample: true
      },
      {
        title: 'Installation',
        code: `npm install @randsum/roller
# or
bun add @randsum/roller`,
        language: 'bash'
      }
    ]
  }
]

export const gamePackages: PackageInfo[] = [
  {
    id: 'blades',
    name: 'blades',
    displayName: 'Blades in the Dark',
    description:
      'Blades in the Dark system mechanics including action rolls, position, effect, and stress tracking.',
    npmPackage: '@randsum/blades',
    category: 'game',
    color: '#f97316', // orange
    examples: [
      {
        title: 'Basic Roll',
        code: `import { rollBlades } from "@randsum/blades"
import type { BladesRollResult } from "@randsum/blades"

// Basic roll with dice pool
const { outcome, result } = rollBlades(2)
console.log(outcome) // 'critical' | 'success' | 'partial' | 'failure'`,
        language: 'typescript',
        hasLiveExample: true
      },
      {
        title: 'Different Dice Pool Sizes',
        code: `import { rollBlades } from "@randsum/blades"

rollBlades(1) // Desperate position
rollBlades(2) // Risky position
rollBlades(3) // Controlled position
rollBlades(4) // Controlled with assistance`,
        language: 'typescript',
        hasLiveExample: true
      },
      {
        title: 'Installation',
        code: `npm install @randsum/blades
# or
bun add @randsum/blades`,
        language: 'bash'
      }
    ]
  },
  {
    id: 'daggerheart',
    name: 'daggerheart',
    displayName: 'Daggerheart',
    description: 'Daggerheart RPG system support with hope and fear dice mechanics.',
    npmPackage: '@randsum/daggerheart',
    category: 'game',
    color: '#9333ea', // purple
    examples: [
      {
        title: 'Basic Usage',
        code: `import { roll } from "@randsum/daggerheart"

// Basic roll with modifier
roll({ modifier: 5 })

// Roll with advantage
roll({
  modifier: 5,
  rollingWith: "Advantage"
})

// Roll with disadvantage
roll({
  modifier: -2,
  rollingWith: "Disadvantage"
})`,
        language: 'typescript',
        hasLiveExample: true
      },
      {
        title: 'Installation',
        code: `npm install @randsum/daggerheart
# or
bun add @randsum/daggerheart`,
        language: 'bash'
      }
    ]
  },
  {
    id: 'fifth',
    name: 'fifth',
    displayName: 'D&D 5th Edition',
    description:
      'Dungeons & Dragons 5th Edition mechanics including ability checks, saving throws, and combat rolls.',
    npmPackage: '@randsum/fifth',
    category: 'game',
    color: '#dc2626', // red
    examples: [
      {
        title: 'Basic Roll',
        code: `import { roll } from "@randsum/fifth"
import type { RollArgument } from "@randsum/fifth"

// Basic roll with modifier
roll({ modifier: 5 })`,
        language: 'typescript',
        hasLiveExample: true
      },
      {
        title: 'Roll with Advantage',
        code: `import { roll } from "@randsum/fifth"

// Roll with advantage
roll({
  modifier: 5,
  rollingWith: "Advantage"
})`,
        language: 'typescript',
        hasLiveExample: true
      },
      {
        title: 'Roll with Disadvantage',
        code: `import { roll } from "@randsum/fifth"

// Roll with disadvantage
roll({
  modifier: -2,
  rollingWith: "Disadvantage"
})`,
        language: 'typescript',
        hasLiveExample: true
      },
      {
        title: 'Installation',
        code: `npm install @randsum/fifth
# or
bun add @randsum/fifth`,
        language: 'bash'
      }
    ]
  },
  {
    id: 'root-rpg',
    name: 'root-rpg',
    displayName: 'Root RPG',
    description:
      'Root RPG system implementation with reputation, relationships, and advancement mechanics.',
    npmPackage: '@randsum/root-rpg',
    category: 'game',
    color: '#22c55e', // green
    examples: [
      {
        title: 'Basic Roll',
        code: `import { rollRootRpg } from "@randsum/root-rpg"
import type { RootRpgRollResult } from "@randsum/root-rpg"

// Basic roll with modifier
const { outcome, roll, result } = rollRootRpg(2)
// outcome: 'Strong Hit' | 'Weak Hit' | 'Miss'
// roll: numeric total, result: detailed roll information`,
        language: 'typescript',
        hasLiveExample: true
      },
      {
        title: 'Type-Safe Result Handling',
        code: `import { rollRootRpg } from "@randsum/root-rpg"

const { outcome } = rollRootRpg(0)
switch (outcome) {
  case "Strong Hit":
    // 10 or higher
    break
  case "Weak Hit":
    // 7-9
    break
  case "Miss":
    // 6 or lower
    break
}`,
        language: 'typescript',
        hasLiveExample: true
      },
      {
        title: 'Installation',
        code: `npm install @randsum/root-rpg
# or
bun add @randsum/root-rpg`,
        language: 'bash'
      }
    ]
  },
  {
    id: 'salvageunion',
    name: 'salvageunion',
    displayName: 'Salvage Union',
    description: 'Salvage Union mechanics for mech-based tabletop RPG gameplay.',
    npmPackage: '@randsum/salvageunion',
    category: 'game',
    color: '#60a5fa', // lightblue
    examples: [
      {
        title: 'Basic Roll',
        code: `import { rollTable } from "@randsum/salvageunion"
import type { SalvageUnionTableResult } from "@randsum/salvageunion"

// Basic roll with default table
const result = rollTable()
// Returns table result with hit type, label, description, and roll value`,
        language: 'typescript',
        hasLiveExample: true
      },
      {
        title: 'Roll with Specific Table',
        code: `import { rollTable } from "@randsum/salvageunion"

// Roll with specific table
const result = rollTable("Morale")`,
        language: 'typescript',
        hasLiveExample: true
      },
      {
        title: 'Type-Safe Result Handling',
        code: `import { rollTable } from "@randsum/salvageunion"

const { hit, label, description, roll } = rollTable("Core Mechanic")
switch (hit) {
  case "Nailed It":
    // 20
    break
  case "Success":
    // 11-19
    break
  case "Tough Choice":
    // 6-10
    break
}`,
        language: 'typescript',
        hasLiveExample: true
      },
      {
        title: 'Installation',
        code: `npm install @randsum/salvageunion
# or
bun add @randsum/salvageunion`,
        language: 'bash'
      }
    ]
  }
]

export const toolPackages: PackageInfo[] = [
  {
    id: 'mcp',
    name: 'mcp',
    displayName: 'MCP Server',
    description:
      'Model Context Protocol server for AI integration. Enables LLMs to roll dice and interact with RANDSUM packages.',
    npmPackage: '@randsum/mcp',
    category: 'tool',
    color: '#FFD700', // Gold
    examples: [
      {
        title: 'MCP Client Configuration',
        code: `{
  "mcpServers": {
    "randsum": {
      "command": "npx",
      "args": ["-y", "@randsum/mcp@latest"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}`,
        language: 'json'
      },
      {
        title: 'Installation',
        code: `npm install @randsum/mcp
# or
bun add @randsum/mcp`,
        language: 'bash'
      }
    ]
  },
  {
    id: 'robo',
    name: 'robo',
    displayName: 'Robo Discord Bot',
    description:
      'A Discord bot and activity for rolling dice in chat. Supports all RANDSUM game packages with beautiful embeds and detailed roll results.',
    npmPackage: '@randsum/robo',
    category: 'tool',
    color: '#5865F2', // Discord purple
    examples: [
      {
        title: 'Basic Roll Command',
        code: `/roll notation:4d6L+2`,
        language: 'bash'
      },
      {
        title: 'Installation',
        code: `# Clone the monorepo
git clone https://github.com/RANDSUM/randsum.git
cd randsum/packages/robo

# Install dependencies
bun install

# Set up environment variables
cp example.env .env

# Run the bot
bun run dev`,
        language: 'bash'
      }
    ]
  }
]

export const allPackages: PackageInfo[] = [...corePackages, ...gamePackages, ...toolPackages]

export function getPackageById(id: string): PackageInfo | undefined {
  return allPackages.find(pkg => pkg.id === id)
}
