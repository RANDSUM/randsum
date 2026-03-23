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
      colorLight: '#7c3aed',
      title: 'Core Roll',
      description: 'Roll x dice with N sides each. The foundation of every notation string.',
      displayBase: 'xDN',
      forms: [{ notation: 'xDN', note: 'Roll x dice, N sides each' }],
      examples: [
        { description: 'Roll one d20', notation: '1d20', options: { sides: 20 } },
        { description: 'Roll four d6', notation: '4d6', options: { sides: 6, quantity: 4 } },
        { description: 'Roll two d8', notation: '2d8', options: { sides: 8, quantity: 2 } }
      ]
    }
  },
  {
    name: 'percentile',
    doc: {
      key: 'd%',
      category: 'Special',
      color: '#a78bfa',
      colorLight: '#6d28d9',
      title: 'Percentile Die',
      description: 'Shorthand for a 100-sided die. Equivalent to 1d100.',
      displayBase: 'd%',
      forms: [{ notation: 'd%', note: 'Roll 1-100' }],
      examples: [
        { description: 'Roll 1-100', notation: 'd%', options: { sides: 100 } }
      ]
    }
  },
  {
    name: 'fate',
    doc: {
      key: 'dF',
      category: 'Special',
      color: '#e879f9',
      colorLight: '#a21caf',
      title: 'Fate / Fudge Die',
      description: 'Fate dice show -1, 0, or +1. dF.2 is the extended Fudge variant (-2 to +2).',
      displayBase: 'dF',
      forms: [
        { notation: 'dF', note: 'Fate Core die: -1, 0, or +1' },
        { notation: 'dF.2', note: 'Extended Fudge die: -2 to +2' }
      ],
      examples: [
        { description: 'Fate Core: four Fate dice (-4 to +4)', notation: '4dF', options: { sides: [-1, 0, 1], quantity: 4 } },
        { description: 'Extended Fudge die (-2 to +2)', notation: 'dF.2', options: { sides: [-2, -1, 0, 1, 2] } }
      ]
    }
  },
  {
    name: 'zeroBias',
    doc: {
      key: 'zN',
      category: 'Special',
      color: '#d946ef',
      colorLight: '#86198f',
      title: 'Zero-Bias Die',
      description: 'A zero-indexed die that rolls 0 through N-1 instead of 1 through N.',
      displayBase: 'zN',
      forms: [{ notation: 'zN', note: 'Roll 0 to N-1' }],
      examples: [
        { description: 'Roll 0-5 instead of 1-6', notation: 'z6', options: { sides: [0, 1, 2, 3, 4, 5] } }
      ]
    }
  },
  {
    name: 'geometric',
    doc: {
      key: 'gN',
      category: 'Special',
      color: '#818cf8',
      colorLight: '#4f46e5',
      title: 'Geometric Die',
      description: 'Roll an N-sided die repeatedly until a 1 appears. Total is the count of rolls.',
      displayBase: 'gN',
      forms: [{ notation: 'gN', note: 'Roll until 1 appears; count rolls' }],
      examples: [
        { description: 'Geometric d6 — roll until 1', notation: 'g6' }
      ]
    }
  },
  {
    name: 'draw',
    doc: {
      key: 'DDN',
      category: 'Special',
      color: '#c4b5fd',
      colorLight: '#7e22ce',
      title: 'Draw Die',
      description: 'Draw dice from a pool without replacement — each value can only appear once.',
      displayBase: 'DDN',
      forms: [{ notation: 'xDDN', note: 'Draw x unique values from 1-N' }],
      examples: [
        { description: 'Draw 3 unique values from 1-6', notation: '3DD6' }
      ]
    }
  },
  {
    name: 'customFaces',
    doc: {
      key: 'd{...}',
      category: 'Special',
      color: '#f0abfc',
      colorLight: '#c026d3',
      title: 'Custom Faces Die',
      description: 'A die with custom face values. Faces can be any values.',
      displayBase: 'd{...}',
      forms: [{ notation: 'd{a,b,c,...}', note: 'Comma-separated list of face values' }],
      examples: [
        { description: 'Weighted custom die', notation: 'd{1,2,2,3,3,4}' },
        { description: 'Coin flip (heads/tails)', notation: 'd{H,T}', options: { sides: ['H', 'T'] } }
      ]
    }
  }
]
