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
}

export const corePackages: PackageInfo[] = [
  {
    id: 'roller',
    name: 'roller',
    displayName: 'Roller',
    description: 'Zero-dependency dice engine with full notation support.',
    npmPackage: '@randsum/roller',
    category: 'core',
    color: '#f8fafc', // white (slate-50) — uses --tool-roller CSS var which adapts dark/light
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
        language: 'typescript'
      },
      {
        title: 'Character Stat Roll',
        code: `import { roll } from '@randsum/roller';

// Roll 4d6, drop lowest (D&D ability scores)
roll('4d6L');`,
        language: 'typescript'
      },
      {
        title: 'Advantage and Disadvantage',
        code: `import { roll } from '@randsum/roller';

// Roll with advantage (2d20, keep highest)
roll('2d20H');

// Roll with disadvantage (2d20, keep lowest)
roll('2d20L');`,
        language: 'typescript'
      },
      {
        title: 'Complex Notation',
        code: `import { roll } from '@randsum/roller';

// Roll 4d6, drop lowest, reroll below 3
roll('4d6L!R{<3}');`,
        language: 'typescript'
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
    description: 'Action roll resolution for Blades in the Dark.',
    npmPackage: '@randsum/blades',
    category: 'game',
    color: '#f97316', // orange
    examples: [
      {
        title: 'Basic Roll',
        code: `import { roll } from "@randsum/blades"
import type { BladesRollResult } from "@randsum/blades"

// Basic roll with dice pool
const { outcome, result } = roll(2)
console.log(outcome) // 'critical' | 'success' | 'partial' | 'failure'`,
        language: 'typescript'
      },
      {
        title: 'Different Dice Pool Sizes',
        code: `import { roll } from "@randsum/blades"

roll(1) // Desperate position
roll(2) // Risky position
roll(3) // Controlled position
roll(4) // Controlled with assistance`,
        language: 'typescript'
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
    description: 'Hope and fear roll resolution for Daggerheart.',
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
        language: 'typescript'
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
    description: 'd20 roll resolution for D&D 5e.',
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
        language: 'typescript'
      },
      {
        title: 'Roll with Advantage',
        code: `import { roll } from "@randsum/fifth"

// Roll with advantage
roll({
  modifier: 5,
  rollingWith: { advantage: true }
})`,
        language: 'typescript'
      },
      {
        title: 'Roll with Disadvantage',
        code: `import { roll } from "@randsum/fifth"

// Roll with disadvantage
roll({
  modifier: -2,
  rollingWith: { disadvantage: true }
})`,
        language: 'typescript'
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
    description: '2d6 roll resolution for Root RPG.',
    npmPackage: '@randsum/root-rpg',
    category: 'game',
    color: '#22c55e', // green
    examples: [
      {
        title: 'Basic Roll',
        code: `import { roll } from "@randsum/root-rpg"
import type { RootRpgResult } from "@randsum/root-rpg"

// Basic roll with modifier
const { outcome, roll, result } = roll(2)
// outcome: 'Strong Hit' | 'Weak Hit' | 'Miss'
// roll: numeric total, result: detailed roll information`,
        language: 'typescript'
      },
      {
        title: 'Type-Safe Result Handling',
        code: `import { roll } from "@randsum/root-rpg"

const { outcome } = roll(0)
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
        language: 'typescript'
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
    description: 'd20 table lookups for Salvage Union.',
    npmPackage: '@randsum/salvageunion',
    category: 'game',
    color: '#60a5fa', // lightblue
    examples: [
      {
        title: 'Basic Roll',
        code: `import { roll } from "@randsum/salvageunion"
import type { SalvageUnionTableResult } from "@randsum/salvageunion"

// Basic roll with default table
const result = roll()
// Returns table result with hit type, label, description, and roll value`,
        language: 'typescript'
      },
      {
        title: 'Roll with Specific Table',
        code: `import { roll } from "@randsum/salvageunion"

// Roll with specific table
const result = roll("Morale")`,
        language: 'typescript'
      },
      {
        title: 'Type-Safe Result Handling',
        code: `import { roll } from "@randsum/salvageunion"

const { hit, label, description, roll } = roll("Core Mechanic")
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
        language: 'typescript'
      },
      {
        title: 'Installation',
        code: `npm install @randsum/salvageunion
# or
bun add @randsum/salvageunion`,
        language: 'bash'
      }
    ]
  },
  {
    id: 'pbta',
    name: 'pbta',
    displayName: 'Powered by the Apocalypse',
    description: '2d6 roll resolution for any PbtA system.',
    npmPackage: '@randsum/pbta',
    category: 'game',
    color: '#6b7280', // grey
    examples: [
      {
        title: 'Basic Roll',
        code: `import { roll } from "@randsum/pbta"

// Basic roll with stat modifier
const result = roll({ stat: 2 })
// result.result: 'strong_hit' | 'weak_hit' | 'miss'`,
        language: 'typescript'
      },
      {
        title: 'With Bonuses',
        code: `import { roll } from "@randsum/pbta"

// With forward and ongoing bonuses
const result = roll({
  stat: 1,
  forward: 1,  // One-time bonus
  ongoing: 0   // Persistent bonus
})`,
        language: 'typescript'
      },
      {
        title: 'With Advantage',
        code: `import { roll } from "@randsum/pbta"

// Roll with advantage (3d6, keep 2 highest)
const result = roll({
  stat: 2,
  advantage: true
})`,
        language: 'typescript'
      },
      {
        title: 'Installation',
        code: `npm install @randsum/pbta
# or
bun add @randsum/pbta`,
        language: 'bash'
      }
    ]
  }
]

export const toolPackages: PackageInfo[] = [
  {
    id: 'skill',
    name: 'skill',
    displayName: 'LLM Skill',
    description: 'Prompt file for teaching RANDSUM dice notation to any LLM.',
    npmPackage: 'skills/dice-rolling/SKILL.md',
    category: 'tool',
    color: '#06b6d4', // cyan-500 — AI/technical feel; distinct from Discord purple (#5865F2)
    examples: [
      {
        title: 'Claude Code Setup',
        code: `# Download the skill into your project
curl -o .claude/skills/dice-rolling/SKILL.md \\
  https://raw.githubusercontent.com/RANDSUM/randsum/main/skills/dice-rolling/SKILL.md`,
        language: 'bash'
      }
    ]
  },
  {
    id: 'discord-bot',
    name: 'discord-bot',
    displayName: 'Discord Bot',
    description: 'Discord bot with slash commands for all RANDSUM packages.',
    npmPackage: '@randsum/discord-bot',
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
        code: `# From the monorepo root
cd apps/discord-bot

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env

# Deploy commands
bun run deploy-commands

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
