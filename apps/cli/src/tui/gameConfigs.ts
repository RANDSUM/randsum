// apps/cli/src/tui/gameConfigs.ts
// SYNC: apps/site/src/components/playground/gameConfigs.ts
// Differences: color values are Ink color strings (not CSS variables)
export interface FieldConfig {
  readonly name: string
  readonly label: string
  readonly type: 'number' | 'select' | 'boolean'
  readonly options?: readonly string[]
  readonly min?: number
  readonly max?: number
  readonly defaultValue: string | number | boolean
}

export interface GameConfig {
  readonly id: string
  readonly name: string
  readonly color: string // Ink color string, not CSS variable
  readonly fields: readonly FieldConfig[]
}

export const GAME_CONFIGS: readonly GameConfig[] = [
  {
    id: 'fifth',
    name: 'D&D 5e',
    color: 'red',
    fields: [
      { name: 'modifier', label: 'Modifier', type: 'number', min: -30, max: 30, defaultValue: 0 },
      {
        name: 'rollingWith',
        label: 'Rolling With',
        type: 'select',
        options: ['Normal', 'Advantage', 'Disadvantage'],
        defaultValue: 'Normal'
      }
    ]
  },
  {
    id: 'blades',
    name: 'Blades in the Dark',
    color: 'magenta',
    fields: [
      { name: 'diceCount', label: 'Dice Pool', type: 'number', min: 0, max: 10, defaultValue: 2 }
    ]
  },
  {
    id: 'daggerheart',
    name: 'Daggerheart',
    color: 'blue',
    fields: [
      { name: 'modifier', label: 'Modifier', type: 'number', min: -20, max: 20, defaultValue: 0 },
      {
        name: 'rollingWith',
        label: 'Rolling With',
        type: 'select',
        options: ['Normal', 'Advantage', 'Disadvantage'],
        defaultValue: 'Normal'
      },
      { name: 'amplifyHope', label: 'Amplify Hope', type: 'boolean', defaultValue: false },
      { name: 'amplifyFear', label: 'Amplify Fear', type: 'boolean', defaultValue: false }
    ]
  },
  {
    id: 'pbta',
    name: 'Powered by the Apocalypse',
    color: 'green',
    fields: [
      { name: 'stat', label: 'Stat', type: 'number', min: -3, max: 5, defaultValue: 0 },
      { name: 'forward', label: 'Forward', type: 'number', min: -5, max: 5, defaultValue: 0 },
      { name: 'ongoing', label: 'Ongoing', type: 'number', min: -5, max: 5, defaultValue: 0 },
      { name: 'advantage', label: 'Advantage', type: 'boolean', defaultValue: false },
      { name: 'disadvantage', label: 'Disadvantage', type: 'boolean', defaultValue: false }
    ]
  },
  {
    id: 'root-rpg',
    name: 'Root RPG',
    color: 'yellow',
    fields: [{ name: 'bonus', label: 'Bonus', type: 'number', min: -20, max: 20, defaultValue: 0 }]
  },
  {
    id: 'salvageunion',
    name: 'Salvage Union',
    color: 'cyan',
    fields: [
      {
        name: 'tableName',
        label: 'Table',
        type: 'select',
        options: ['Core Mechanic'],
        defaultValue: 'Core Mechanic'
      }
    ]
  }
] as const
