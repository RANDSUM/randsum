import type { NotationDoc } from '../docs/modifierDocs'

interface DiceSchema {
  readonly name: string
  readonly doc: NotationDoc
}

export const RANDSUM_DICE_SCHEMAS: readonly DiceSchema[] = [
  {
    name: 'core',
    doc: {
      key: 'xDN',
      category: 'Core',
      color: '#c084fc',
      title: 'Core Roll',
      description: 'Roll x dice with N sides each. The foundation of every notation string.',
      displayBase: 'xDN',
      forms: [{ notation: 'xDN', note: 'Roll x dice, N sides each' }],
      examples: [
        { notation: '1d20', description: 'Roll one d20' },
        { notation: '4d6', description: 'Roll four d6' },
        { notation: '2d8', description: 'Roll two d8' }
      ]
    }
  },
  {
    name: 'percentile',
    doc: {
      key: 'd%',
      category: 'Special',
      color: '#a78bfa',
      title: 'Percentile Die',
      description: 'Shorthand for a 100-sided die. Equivalent to 1d100.',
      displayBase: 'd%',
      forms: [{ notation: 'd%', note: 'Roll 1-100' }],
      examples: [{ notation: 'd%', description: 'Roll 1-100' }]
    }
  },
  {
    name: 'fate',
    doc: {
      key: 'dF',
      category: 'Special',
      color: '#e879f9',
      title: 'Fate / Fudge Die',
      description: 'Fate dice show -1, 0, or +1. dF.2 is the extended Fudge variant (-2 to +2).',
      displayBase: 'dF',
      forms: [
        { notation: 'dF', note: 'Fate Core die: -1, 0, or +1' },
        { notation: 'dF.2', note: 'Extended Fudge die: -2 to +2' }
      ],
      examples: [
        { notation: '4dF', description: 'Fate Core: four Fate dice (-4 to +4)' },
        { notation: 'dF.2', description: 'Extended Fudge die (-2 to +2)' }
      ]
    }
  },
  {
    name: 'zeroBias',
    doc: {
      key: 'zN',
      category: 'Special',
      color: '#d946ef',
      title: 'Zero-Bias Die',
      description: 'A zero-indexed die that rolls 0 through N-1 instead of 1 through N.',
      displayBase: 'zN',
      forms: [{ notation: 'zN', note: 'Roll 0 to N-1' }],
      examples: [{ notation: 'z6', description: 'Roll 0-5 instead of 1-6' }]
    }
  },
  {
    name: 'geometric',
    doc: {
      key: 'gN',
      category: 'Special',
      color: '#818cf8',
      title: 'Geometric Die',
      description: 'Roll an N-sided die repeatedly until a 1 appears. Total is the count of rolls.',
      displayBase: 'gN',
      forms: [{ notation: 'gN', note: 'Roll until 1 appears; count rolls' }],
      examples: [{ notation: 'g6', description: 'Geometric d6 — roll until 1' }]
    }
  },
  {
    name: 'draw',
    doc: {
      key: 'DDN',
      category: 'Special',
      color: '#c4b5fd',
      title: 'Draw Die',
      description: 'Draw dice from a pool without replacement — each value can only appear once.',
      displayBase: 'DDN',
      forms: [{ notation: 'xDDN', note: 'Draw x unique values from 1-N' }],
      examples: [{ notation: '3DD6', description: 'Draw 3 unique values from 1-6' }]
    }
  },
  {
    name: 'customFaces',
    doc: {
      key: 'd{...}',
      category: 'Special',
      color: '#f0abfc',
      title: 'Custom Faces Die',
      description: 'A die with custom face values. Faces can be any values.',
      displayBase: 'd{...}',
      forms: [{ notation: 'd{a,b,c,...}', note: 'Comma-separated list of face values' }],
      examples: [
        { notation: 'd{1,2,2,3,3,4}', description: 'Weighted custom die' },
        { notation: 'd{H,T}', description: 'Coin flip (heads/tails)' }
      ]
    }
  }
]
