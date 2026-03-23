import type { SupportedGameId } from './gameConfig'

export type InputKind = 'integer' | 'string-options' | 'string-free' | 'boolean'

export interface InputSpec {
  readonly name: string
  readonly label: string
  readonly kind: InputKind
  readonly min?: number
  readonly max?: number
  readonly defaultValue?: number | string | boolean
  readonly options?: readonly string[]
  readonly optional?: boolean
}

/**
 * Static input specs derived from each game's .randsum.json at build time.
 * These drive the auto-generated input forms in GameRoller.
 */
export const GAME_INPUT_SPECS: Readonly<Record<SupportedGameId, readonly InputSpec[]>> = {
  blades: [
    {
      name: 'rating',
      label: 'Action Rating',
      kind: 'integer',
      min: 0,
      max: 6,
      defaultValue: 1
    }
  ],
  fifth: [
    {
      name: 'modifier',
      label: '5E Modifier',
      kind: 'integer',
      min: -30,
      max: 30,
      defaultValue: 0
    },
    {
      name: 'rollingWith',
      label: 'Rolling With',
      kind: 'string-options',
      options: ['Advantage', 'Disadvantage'],
      optional: true
    },
    {
      name: 'crit',
      label: 'Check Crits',
      kind: 'boolean',
      defaultValue: false,
      optional: true
    }
  ],
  daggerheart: [
    {
      name: 'modifier',
      label: 'Modifier',
      kind: 'integer',
      min: -30,
      max: 30,
      defaultValue: 0
    },
    {
      name: 'amplifyHope',
      label: 'Amplify Hope',
      kind: 'boolean',
      defaultValue: false
    },
    {
      name: 'amplifyFear',
      label: 'Amplify Fear',
      kind: 'boolean',
      defaultValue: false
    },
    {
      name: 'rollingWith',
      label: 'Rolling With',
      kind: 'string-options',
      options: ['Advantage', 'Disadvantage'],
      optional: true
    }
  ],
  pbta: [
    {
      name: 'stat',
      label: 'Stat',
      kind: 'integer',
      min: -3,
      max: 5,
      defaultValue: 0
    },
    {
      name: 'forward',
      label: 'Forward',
      kind: 'integer',
      min: -5,
      max: 5,
      defaultValue: 0
    },
    {
      name: 'ongoing',
      label: 'Ongoing',
      kind: 'integer',
      min: -5,
      max: 5,
      defaultValue: 0
    },
    {
      name: 'rollingWith',
      label: 'Rolling With',
      kind: 'string-options',
      options: ['Advantage', 'Disadvantage'],
      optional: true
    }
  ],
  'root-rpg': [
    {
      name: 'bonus',
      label: 'Bonus',
      kind: 'integer',
      min: -3,
      max: 5,
      defaultValue: 0
    }
  ],
  salvageunion: [
    {
      name: 'tableName',
      label: 'Table Name',
      kind: 'string-free'
    }
  ]
}
